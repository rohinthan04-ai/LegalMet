import re
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether
)
from io import BytesIO
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from database import SessionLocal,get_db
from models import Inspector,Inspection,Image,Category, CategoryRule, Rule, Report
from schemas import InspectorCreate, InspectorResponse, InspectorLogin, TokenResponse, InspectionCreate, InspectionResponse, ImageResponse, ProductExtraction, GeminiAnalysisResponse, CategoryResponse, RuleEvaluationResponse, InspectionListItem
from services.gemini_evaluation import evaluate_product_rules
from services.gemini_service import extract_product_details
from core.security import hash_password, verify_password
from auth.jwt_handler import create_access_token
from auth.dependencies import get_current_inspector
from rules.routes import router as rules_router
app = FastAPI(
    title="LegalMet-AI",
    description="Packaged Commodity Inspection Assistant",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://legalmet-1.onrender.com",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "Welcome to LegalMet-AI",
        "status": "Backend running"
    }


# Inspector Registration
@app.post(
    "/auth/register",
    response_model=InspectorResponse,
    status_code=status.HTTP_201_CREATED
)
def register_inspector(
    inspector: InspectorCreate,
    db: Session = Depends(get_db)
):

    # Check whether email already exists
    existing_inspector = db.query(Inspector).filter(
        Inspector.email == inspector.email
    ).first()

    if existing_inspector:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = hash_password(inspector.password)

    # Create inspector
    new_inspector = Inspector(
        name=inspector.name,
        email=inspector.email,
        password=hashed_password
    )

    try:
        db.add(new_inspector)
        db.commit()
        db.refresh(new_inspector)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    return new_inspector



@app.post("/auth/login", response_model=TokenResponse)
def login_inspector(
    inspector: InspectorLogin,
    db: Session = Depends(get_db)
):

    # Find inspector by email
    existing_inspector = db.query(Inspector).filter(
        Inspector.email == inspector.email
    ).first()

    if not existing_inspector:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(
        inspector.password,
        existing_inspector.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check whether inspector is active
    if not existing_inspector.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inspector account is inactive"
        )

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": str(existing_inspector.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }



@app.get("/auth/me", response_model=InspectorResponse)
def get_inspector_profile(
    current_inspector: Inspector = Depends(get_current_inspector)
):
    return current_inspector


@app.post(
    "/inspections",
    response_model=InspectionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_inspection(
    inspection_data: InspectionCreate,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):
    new_inspection = Inspection(
        id=current_inspector.id,
        date=datetime.now(timezone.utc),
        status="pending",
        category=inspection_data.category
    )

    db.add(new_inspection)
    db.commit()
    db.refresh(new_inspection)

    return new_inspection

@app.get("/inspections", response_model=list[InspectionListItem])
def list_inspections(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):
    inspections = (
        db.query(Inspection)
        .filter(Inspection.id == current_inspector.id)
        .order_by(Inspection.date.desc())
        .all()
    )

    result = []
    for ins in inspections:
        image = (
            db.query(Image.img_id)
            .filter(Image.ins_id == ins.ins_id)
            .order_by(Image.img_id.asc())
            .first()
        )
        report = db.query(Report).filter(Report.inspection_id == ins.ins_id).first()

        result.append({
            "ins_id": ins.ins_id,
            "date": ins.date,
            "status": ins.status,
            "category": ins.category,
            "img_id": image.img_id if image else None,
            "has_evaluation": bool(report and report.gemini_report),
            "has_report": bool(report and report.report),
        })
    return result

@app.post(
    "/inspections/{ins_id}/images",
    response_model=ImageResponse,
    status_code=status.HTTP_201_CREATED
)
def upload_image(
    ins_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):
    # Check whether inspection exists and belongs to this inspector
    inspection = db.query(Inspection).filter(
        Inspection.ins_id == ins_id,
        Inspection.id == current_inspector.id
    ).first()

    if inspection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )

    # Validate image type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )

    # Read image as binary data
    image_data = image.file.read()

    if not image_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty"
        )

    # Store image in database
    new_image = Image(
    ins_id=ins_id,
    image=image_data,
    content_type=image.content_type
)

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return new_image

@app.get("/images/{img_id}")
def get_image(
    img_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):
    image_record = db.query(Image).join(Inspection).filter(
        Image.img_id == img_id,
        Inspection.id == current_inspector.id
    ).first()

    if image_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )

    return Response(
    content=image_record.image,
    media_type=image_record.content_type
)

@app.post(
    "/images/{img_id}/analyze",
    response_model=GeminiAnalysisResponse
)
def analyze_image(
    img_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):

    # Find image belonging to the logged-in inspector
    image_record = db.query(Image).join(Inspection).filter(
        Image.img_id == img_id,
        Inspection.id == current_inspector.id
    ).first()

    if image_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )

    if not image_record.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image content type is missing"
        )

    # Send stored image to Gemini
    try:
        extracted_data = extract_product_details(
            image_bytes=image_record.image,
            content_type=image_record.content_type
        )

    except Exception as exc:
        print("GEMINI ERROR:", repr(exc))
        raise HTTPException(
            status_code=502,
            detail="Gemini image analysis failed"
        ) from exc

    # Store extracted details in the database
    try:
        image_record.details = extracted_data.model_dump(mode="json")

        db.commit()
        db.refresh(image_record)

    except Exception as exc:
        db.rollback()
        print("DATABASE ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Failed to save extracted details"
        ) from exc

    # Return extracted JSON
    return GeminiAnalysisResponse(
        img_id=img_id,
        extracted_data=extracted_data
    )

@app.put(
    "/images/{img_id}/details",
    response_model=GeminiAnalysisResponse
)
def confirm_image_details(
    img_id: int,
    details: ProductExtraction,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):
    image_record = db.query(Image).join(Inspection).filter(
        Image.img_id == img_id,
        Inspection.id == current_inspector.id
    ).first()

    if image_record is None:
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        image_record.details = details.model_dump(mode="json")
        db.commit()
    except Exception as exc:
        db.rollback()
        print("DATABASE ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail="Failed to save confirmed details") from exc

    return GeminiAnalysisResponse(img_id=img_id, extracted_data=details)

@app.get("/categories", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):
    categories = db.query(Category).order_by(
        Category.category_name.asc()
    ).all()

    return categories


app.include_router(rules_router)






@app.post(
    "/categories/{c_id}/images/{img_id}/evaluate",
    response_model=RuleEvaluationResponse
)
def evaluate_image(
    c_id: int,
    img_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):

    # 1. Retrieve image belonging to the logged-in inspector
    image_record = db.query(Image).join(Inspection).filter(
        Image.img_id == img_id,
        Inspection.id == current_inspector.id
    ).first()

    if image_record is None:
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )

    # 2. Check whether OCR details exist
    if image_record.details is None:
        raise HTTPException(
            status_code=400,
            detail="Image has not been analysed yet"
        )

    extracted_data = ProductExtraction.model_validate(
        image_record.details
    )

    # 3. Check category
    category = db.query(Category).filter(
        Category.c_id == c_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # 4. Retrieve category rules
    rules = (
        db.query(
            Rule.r_id,
            Rule.rule,
            CategoryRule.is_mandatory
        )
        .join(
            CategoryRule,
            Rule.r_id == CategoryRule.r_id
        )
        .filter(CategoryRule.c_id == c_id)
        .all()
    )

    if not rules:
        raise HTTPException(
            status_code=404,
            detail="No rules found for this category"
        )

    retrieved_rules = [
        {
            "r_id": row.r_id,
            "rule": row.rule,
            "is_mandatory": row.is_mandatory
        }
        for row in rules
    ]

    # 5. Evaluate using Gemini
    try:
        evaluation = evaluate_product_rules(
            extracted_data=extracted_data,
            retrieved_rules=retrieved_rules
        )

    except Exception as exc:
        print("GEMINI EVALUATION ERROR:", repr(exc))

        raise HTTPException(
            status_code=502,
            detail="Gemini rule evaluation failed"
        ) from exc

    # 6. Store Gemini evaluation in reports table
    try:
        inspection_id = image_record.ins_id

        report_record = db.query(Report).filter(
            Report.inspection_id == inspection_id
        ).first()

        if report_record is None:
            report_record = Report(
                inspection_id=inspection_id,
                date=datetime.now(timezone.utc),
                gemini_report=evaluation.model_dump(mode="json")
            )
            db.add(report_record)

        else:
            report_record.date = datetime.now(timezone.utc)
            report_record.gemini_report = evaluation.model_dump(mode="json")

        # Update inspection status
        inspection_record = db.query(Inspection).filter(
            Inspection.ins_id == inspection_id
        ).first()

        inspection_record.status = "completed"
        inspection_record.category = category.category_name
        db.commit()

    except Exception as exc:
        db.rollback()
        print("REPORT DATABASE ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Failed to save Gemini evaluation report"
        ) from exc

    # 7. Return evaluation
    return evaluation



# ---------------------------------------------------------------- palette
NAVY = colors.HexColor("#1F3A5F")
SLATE = colors.HexColor("#5B6B7F")
LIGHT_BG = colors.HexColor("#F4F6F9")
BORDER = colors.HexColor("#D9DEE5")

STATUS_STYLE = {
    "PASS": (colors.HexColor("#1E8E4E"), colors.HexColor("#E6F4EC"), "PASS"),
    "FAIL": (colors.HexColor("#C0392B"), colors.HexColor("#FBEAE8"), "FAIL"),
    "UNABLE_TO_VERIFY": (colors.HexColor("#B7791F"), colors.HexColor("#FDF3DC"), "UNABLE TO VERIFY"),
}
STATUS_ORDER = {"FAIL": 0, "UNABLE_TO_VERIFY": 1, "PASS": 2}

PAGE_W, _ = A4
CONTENT_W = PAGE_W - 36 * mm  # 18mm margins


# ---------------------------------------------------------------- helpers
SECTION_RE = re.compile(r"^([A-Z][A-Z &/\-]{2,}):\s*(.*)$")


def parse_rule(raw):
    """Split the long 'RULE TITLE: ... LEGAL REQUIREMENT: ...' text into sections."""
    sections, current = {}, None
    for line in (raw or "").splitlines():
        line = line.strip()
        if not line:
            continue
        m = SECTION_RE.match(line)
        if m:
            current = m.group(1)
            sections[current] = m.group(2).strip()
        elif current:
            sections[current] = (sections[current] + " " + line).strip()
        else:
            sections.setdefault("RULE TITLE", line)
    return sections


def fmt_value(value):
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value)
    return str(value)


def fmt_date(value):
    if isinstance(value, datetime):
        return value.strftime("%d %b %Y, %I:%M %p")
    return str(value)


def p(text, style):
    return Paragraph(escape(str(text)), style)


class NumberedCanvas(canvas.Canvas):
    """Canvas that draws header band + 'Page x of y' footer on every page."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_pages = []

    def showPage(self):
        self._saved_pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_pages)
        for state in self._saved_pages:
            self.__dict__.update(state)
            self._decorate(total)
            super().showPage()
        super().save()

    def _decorate(self, total):
        # top accent band
        self.setFillColor(NAVY)
        self.rect(0, A4[1] - 6 * mm, A4[0], 6 * mm, stroke=0, fill=1)
        # footer
        self.setStrokeColor(BORDER)
        self.setLineWidth(0.6)
        self.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
        self.setFont("Helvetica", 8)
        self.setFillColor(SLATE)
        self.drawString(18 * mm, 9.5 * mm, "LegalMet-AI  |  AI-assisted inspection report (preliminary)")
        self.drawRightString(A4[0] - 18 * mm, 9.5 * mm, f"Page {self._pageNumber} of {total}")


# ---------------------------------------------------------------- endpoint
@app.get("/inspections/{ins_id}/report")
def generate_inspection_report(
    ins_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector),
):
    # 1. Inspection (check this filter: see note in reply)
    inspection = db.query(Inspection).filter(
        Inspection.ins_id == ins_id,
        Inspection.id == current_inspector.id,
    ).first()
    if inspection is None:
        raise HTTPException(status_code=404, detail="Inspection not found")

    # 2. Gemini report
    report_record = db.query(Report).filter(Report.inspection_id == ins_id).first()
    if report_record is None or report_record.gemini_report is None:
        raise HTTPException(status_code=404, detail="Gemini evaluation report not found")
    gemini_data = report_record.gemini_report

    # 3. Product details
    image_record = db.query(Image).filter(Image.ins_id == ins_id).first()
    product_details = image_record.details if image_record else None

    # 4. Rules
    evaluations = gemini_data.get("inspection_evaluation", [])
    rule_ids = [item["r_id"] for item in evaluations]
    rule_records = db.query(Rule).filter(Rule.r_id.in_(rule_ids)).all()
    rule_lookup = {rule.r_id: rule.rule for rule in rule_records}

    # 5. Styles
    base = getSampleStyleSheet()["BodyText"]
    s_title = ParagraphStyle("t", parent=base, fontName="Helvetica-Bold", fontSize=22,
                             textColor=colors.white, alignment=TA_LEFT, leading=26)
    s_sub = ParagraphStyle("st", parent=base, fontSize=10.5, textColor=colors.HexColor("#CBD6E6"),
                           leading=14)
    s_h = ParagraphStyle("h", parent=base, fontName="Helvetica-Bold", fontSize=13,
                         textColor=NAVY, spaceBefore=14, spaceAfter=6, leading=16)
    s_label = ParagraphStyle("l", parent=base, fontName="Helvetica-Bold", fontSize=8.5,
                             textColor=SLATE, leading=11)
    s_val = ParagraphStyle("v", parent=base, fontSize=9.5, textColor=colors.HexColor("#1B2430"),
                           leading=13)
    s_small = ParagraphStyle("sm", parent=base, fontSize=8, textColor=SLATE, leading=10.5)
    s_body = ParagraphStyle("b", parent=base, fontSize=9, leading=12.5,
                            textColor=colors.HexColor("#1B2430"))
    s_rule_title = ParagraphStyle("rt", parent=base, fontName="Helvetica-Bold", fontSize=10,
                                  textColor=colors.HexColor("#1B2430"), leading=13)
    s_badge = ParagraphStyle("bd", parent=base, fontName="Helvetica-Bold", fontSize=7.5,
                             alignment=TA_CENTER, leading=10)
    s_stat_num = ParagraphStyle("sn", parent=base, fontName="Helvetica-Bold", fontSize=22,
                                alignment=TA_CENTER, leading=26)
    s_stat_lbl = ParagraphStyle("sl", parent=base, fontName="Helvetica-Bold", fontSize=7.5,
                                alignment=TA_CENTER, textColor=SLATE, leading=10)
    s_note = ParagraphStyle("n", parent=base, fontSize=9, leading=13, textColor=colors.HexColor("#7A4B00"))

    story = []

    # 6. Title banner
    banner = Table(
        [[Paragraph("LegalMet-AI", s_title)],
         [Paragraph("Packaged Commodity Inspection Report", s_sub)]],
        colWidths=[CONTENT_W],
    )
    banner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (0, 0), 14),
        ("BOTTOMPADDING", (0, 1), (0, 1), 14),
        ("TOPPADDING", (0, 1), (0, 1), 0),
        ("BOTTOMPADDING", (0, 0), (0, 0), 2),
    ]))
    story += [banner, Spacer(1, 10)]

    # 7. Inspection information (2 x 2 grid of label/value pairs)
    def kv(label, value):
        return [Paragraph(label.upper(), s_label), Paragraph(escape(str(value)), s_val)]

    info_items = [
        ("Inspection ID", inspection.ins_id),
        ("Inspection Date", fmt_date(inspection.date)),
        ("Inspector", current_inspector.name),
        ("Email", current_inspector.email),
        ("Category", (inspection.category or "Not specified").title()),
        ("Status", (inspection.status or "").title()),
    ]
    cells = []
    for label, value in info_items:
        cells.append([Paragraph(label.upper(), s_label), Paragraph(escape(str(value)), s_val)])
    grid = []
    for i in range(0, len(cells), 2):
        grid.append([cells[i], cells[i + 1]])
    info_table = Table(grid, colWidths=[CONTENT_W / 2] * 2)
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story += [info_table]

    # 8. Product details
    story.append(Paragraph("Extracted Product Details", s_h))
    rows = []
    if product_details:
        for key, value in product_details.items():
            if value is not None:
                rows.append([
                    Paragraph(escape(key.replace("_", " ").title()), s_label),
                    Paragraph(escape(fmt_value(value)), s_val),
                ])
    if rows:
        pt = Table(rows, colWidths=[48 * mm, CONTENT_W - 48 * mm])
        pt.setStyle(TableStyle([
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT_BG]),
            ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
            ("LINEBELOW", (0, 0), (-1, -2), 0.3, BORDER),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(pt)
    else:
        story.append(Paragraph("No extracted product details available.", s_body))

    # 9. Summary cards
    counts = {k: sum(1 for i in evaluations if i["status"] == k) for k in STATUS_STYLE}
    total = len(evaluations)

    story.append(Paragraph("Evaluation Summary", s_h))
    stat_cells, stat_styles = [], []
    for idx, key in enumerate(["PASS", "FAIL", "UNABLE_TO_VERIFY"]):
        fg, bg, label = STATUS_STYLE[key]
        num = ParagraphStyle(f"n{idx}", parent=s_stat_num, textColor=fg)
        stat_cells.append([Paragraph(str(counts[key]), num), Paragraph(label, s_stat_lbl)])
        stat_styles.append(("BACKGROUND", (idx, 0), (idx, 0), bg))
    stat_cells.append([Paragraph(str(total), ParagraphStyle("nt", parent=s_stat_num, textColor=NAVY)),
                       Paragraph("TOTAL RULES", s_stat_lbl)])
    stat_styles.append(("BACKGROUND", (3, 0), (3, 0), LIGHT_BG))

    stats = Table([stat_cells], colWidths=[CONTENT_W / 4] * 4)
    stats.setStyle(TableStyle(stat_styles + [
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 2, colors.white),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(stats)

    # progress bar (pass / fail / unable proportions)
    if total:
        bar_w = [CONTENT_W * counts[k] / total for k in ("PASS", "FAIL", "UNABLE_TO_VERIFY")]
        bar_cols = [w for w in bar_w if w > 0]
        bar_keys = [k for k, w in zip(("PASS", "FAIL", "UNABLE_TO_VERIFY"), bar_w) if w > 0]
        bar = Table([[""] * len(bar_cols)], colWidths=bar_cols, rowHeights=[5])
        bar.setStyle(TableStyle(
            [("BACKGROUND", (i, 0), (i, 0), STATUS_STYLE[k][0]) for i, k in enumerate(bar_keys)]
        ))
        story += [Spacer(1, 6), bar]

    # 10. Rule cards (FAIL first, then UNABLE_TO_VERIFY, then PASS)
    story.append(Paragraph("Rule Evaluation Results", s_h))
    ordered = sorted(evaluations, key=lambda i: (STATUS_ORDER.get(i["status"], 3), i["r_id"]))

    for item in ordered:
        fg, bg, label = STATUS_STYLE.get(item["status"], (SLATE, LIGHT_BG, item["status"]))
        sections = parse_rule(rule_lookup.get(item["r_id"], ""))
        title = sections.get("RULE TITLE") or "Rule not found"
        legal_ref = sections.get("LEGAL REFERENCE")
        evidence = item.get("evidence")

        badge_style = ParagraphStyle("bs", parent=s_badge, textColor=fg)
        rows = [[
            Paragraph(f"#{item['r_id']}", s_small),
            Paragraph(escape(title), s_rule_title),
            Paragraph(label, badge_style),
        ]]
        rows.append(["", [Paragraph("<b>Assessment:</b> " + escape(item["reason"]), s_body)], ""])
        if evidence and evidence != "Not available":
            rows.append(["", [Paragraph("<b>Evidence:</b> " + escape(str(evidence)), s_body)], ""])
        if legal_ref:
            rows.append(["", [Paragraph("Ref: " + escape(legal_ref), s_small)], ""])

        last = len(rows) - 1
        card = Table(rows, colWidths=[16 * mm, CONTENT_W - 16 * mm - 32 * mm, 32 * mm])
        card.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
            ("LINEBEFORE", (0, 0), (0, -1), 3, fg),
            ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BG),
            ("BACKGROUND", (2, 0), (2, 0), bg),
            ("SPAN", (1, 1), (2, 1)),
            *[("SPAN", (1, r), (2, r)) for r in range(2, last + 1)],
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("VALIGN", (1, 1), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story += [KeepTogether(card), Spacer(1, 6)]

    # 11. Verification section
    disclaimer = Table(
        [[Paragraph(
            "<b>Inspector Physical Verification.</b> This AI-generated assessment is preliminary and "
            "must be physically verified by the inspector. It does not constitute a final legal "
            "determination.", s_note)]],
        colWidths=[CONTENT_W],
    )
    disclaimer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF8E6")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#F0D9A0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))

    sig = Table(
        [["", ""],
         [Paragraph("Inspector Signature", s_small), Paragraph("Date", s_small)]],
        colWidths=[CONTENT_W * 0.6, CONTENT_W * 0.4],
        rowHeights=[22 * mm, None],
    )
    sig.setStyle(TableStyle([
        ("LINEABOVE", (0, 1), (0, 1), 0.8, SLATE),
        ("LINEABOVE", (1, 1), (1, 1), 0.8, SLATE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 20),
    ]))
    story.append(KeepTogether([Spacer(1, 14), disclaimer, sig]))

    # Build PDF
    pdf_buffer = BytesIO()
    document = SimpleDocTemplate(
        pdf_buffer, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=20 * mm,
        title=f"LegalMet Inspection Report #{ins_id}",
        author="LegalMet-AI",
    )
    document.build(story, canvasmaker=NumberedCanvas)
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()

    # 12. Persist
    try:
        report_record.report = pdf_bytes
        db.commit()
    except Exception as exc:
        db.rollback()
        print("PDF DATABASE ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail="Failed to save PDF report") from exc

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="LegalMet_Report_{ins_id}.pdf"'},
    )