from fastapi import APIRouter, Depends, HTTPException
from models import Category, CategoryRule, Rule
from database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from auth.dependencies import get_current_inspector
from models import Inspector
router = APIRouter(
    prefix="/categories",
    tags=["Rules"]
)

@router.get("/{c_id}/rules")
def get_category_rules(
    c_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(get_current_inspector)
):

    category = db.query(Category).filter(Category.c_id == c_id).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    rules = (
        db.query(
            Rule.r_id,
            Rule.rule,
            CategoryRule.is_mandatory
        )
        .join(CategoryRule, Rule.r_id == CategoryRule.r_id)
        .filter(CategoryRule.c_id == c_id)
        .all()
    )

    return [
    {
        "r_id": row.r_id,
        "rule": row.rule,
        "is_mandatory": row.is_mandatory
    }
    for row in rules
]