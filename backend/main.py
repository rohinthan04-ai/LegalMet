
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from database import SessionLocal,get_db
from models import Inspector,Inspection,Image,Category, CategoryRule, Rule
from schemas import InspectorCreate, InspectorResponse, InspectorLogin, TokenResponse, InspectionCreate, InspectionResponse, ImageResponse, ProductExtraction, GeminiAnalysisResponse, CategoryResponse, RuleEvaluationResponse
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
    "/categories/{c_id}/evaluate",
    response_model=RuleEvaluationResponse
)
def evaluate_category_rules(
    c_id: int,
    extracted_data: ProductExtraction,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):

    # Check whether category exists
    category = db.query(Category).filter(
        Category.c_id == c_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Retrieve rules belonging to the selected category
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

    # Convert SQLAlchemy rows into dictionaries
    retrieved_rules = [
        {
            "r_id": row.r_id,
            "rule": row.rule,
            "is_mandatory": row.is_mandatory
        }
        for row in rules
    ]

    # Send product data and retrieved rules to Gemini
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

    return evaluation
