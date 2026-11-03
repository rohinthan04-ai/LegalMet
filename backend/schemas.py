
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime


class InspectorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class InspectorResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class InspectorLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class InspectionCreate(BaseModel):
    category: str = Field(min_length=2, max_length=100)


class InspectionResponse(BaseModel):
    ins_id: int
    date: datetime
    status: str
    category: str

    model_config = ConfigDict(from_attributes=True)

class ImageResponse(BaseModel):
    img_id: int
    ins_id: int

    model_config = ConfigDict(from_attributes=True)