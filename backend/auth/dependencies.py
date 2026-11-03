
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import Inspector
from auth.jwt_handler import verify_access_token


bearer_scheme = HTTPBearer()




# Authenticate inspector
def get_current_inspector(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    inspector_id = verify_access_token(token)

    if inspector_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    inspector = db.query(Inspector).filter(
        Inspector.id == int(inspector_id)
    ).first()

    if inspector is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inspector not found"
        )

    if not inspector.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inspector account is inactive"
        )

    return inspector
