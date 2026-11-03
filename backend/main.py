
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models import Inspector
from schemas import InspectorCreate, InspectorResponse
from core.security import hash_password


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
