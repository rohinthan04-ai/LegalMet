
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    CheckConstraint,
    LargeBinary
)
from sqlalchemy.dialects.postgresql import JSONB

from sqlalchemy.orm import relationship
from database import Base


class Inspector(Base):
    __tablename__ = "inspector"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(255), unique=True)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

    inspections = relationship("Inspection", back_populates="inspector")


class Inspection(Base):
    __tablename__ = "inspections"

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'completed')",
            name="check_inspection_status"
        ),
    )

    ins_id = Column(Integer, primary_key=True, index=True)
    id = Column(Integer, ForeignKey("inspector.id"))
    date = Column(DateTime)
    status = Column(String(20))
    category = Column(String(100))

    inspector = relationship("Inspector", back_populates="inspections")
    images = relationship("Image", back_populates="inspection")
    report = relationship("Report", back_populates="inspection", uselist=False)


class Image(Base):
    __tablename__ = "images"

    img_id = Column(Integer, primary_key=True, index=True)
    ins_id = Column(Integer, ForeignKey("inspections.ins_id"))
    image = Column(LargeBinary, nullable=False)
    content_type = Column(String(100), nullable=False)
    details = Column(JSONB, nullable=True)

    inspection = relationship("Inspection", back_populates="images")


class Category(Base):
    __tablename__ = "category"

    c_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(100))


class Rule(Base):
    __tablename__ = "rules"

    r_id = Column(Integer, primary_key=True, index=True)
    rule = Column(Text)


class CategoryRule(Base):
    __tablename__ = "category_rule"

    c_id = Column(Integer, ForeignKey("category.c_id"), primary_key=True)
    r_id = Column(Integer, ForeignKey("rules.r_id"), primary_key=True)
    is_mandatory = Column(Boolean)


class Report(Base):
    __tablename__ = "reports"

    inspection_id = Column(
        Integer,
        ForeignKey("inspections.ins_id"),
        primary_key=True
    )

    date = Column(DateTime)
    report = Column(LargeBinary)
    gemini_report = Column(JSONB, nullable=True)
    inspection = relationship("Inspection", back_populates="report")
