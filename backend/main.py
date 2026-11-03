
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import SessionLocal,get_db
from models import Inspector
from schemas import InspectorCreate, InspectorResponse,InspectorLogin, TokenResponse
from core.security import hash_password, verify_password
from auth.jwt_handler import create_access_token
from auth.dependencies import get_current_inspector

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
