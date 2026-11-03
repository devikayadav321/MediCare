import re
from pydantic import BaseModel, field_validator
from typing import Optional, List

class UserCreate(BaseModel):
    email: str
    password: str
    role: str  # "patient" or "doctor"
    full_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address.")
        return value

class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address.")
        return value

class Token(BaseModel):
    access_token: str
    token_type: str

class ExtractedValueResponse(BaseModel):
    id: int
    test_name: str
    result_value: str
    unit: Optional[str]
    reference_range: Optional[str]
    is_out_of_range: bool
    evidence_snippet: Optional[str]
    is_verified: bool
    corrected_value: Optional[str]

    class Config:
        from_attributes = True

class VerifyRequestItem(BaseModel):
    extraction_id: int
    is_verified: bool
    corrected_value: Optional[str] = None

class ReportVerifyPayload(BaseModel):
    verifications: List[VerifyRequestItem]
    clinical_notes: Optional[str] = None
