
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


class ProductExtraction(BaseModel):
    product_name: str | None = Field(
        default=None,
        description="Product name visible on the package"
    )
    mrp: str | None = Field(
        default=None,
        description="Maximum retail price, including currency and tax wording if visible"
    )
    net_quantity: str | None = Field(
        default=None,
        description="Net quantity, weight or volume"
    )
    manufacturer_or_packer: str | None = Field(
        default=None,
        description="Manufacturer, packer or importer details"
    )
    manufacturing_or_packing_date: str | None = Field(
        default=None,
        description="Manufacturing or packing date"
    )
    expiry_or_best_before: str | None = Field(
        default=None,
        description="Expiry date or best-before declaration"
    )
    batch_or_lot_number: str | None = Field(
        default=None,
        description="Batch or lot number"
    )
    country_of_origin: str | None = Field(
        default=None,
        description="Country of origin, if visible"
    )
    consumer_care_details: str | None = Field(
        default=None,
        description="Consumer care contact details"
    )
    other_visible_declarations: list[str] = Field(
        default_factory=list,
        description="Other relevant declarations visible on the package"
    )


class GeminiAnalysisResponse(BaseModel):
    img_id: int
    extracted_data: ProductExtraction