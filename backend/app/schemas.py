from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# Auth
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    notifications_enabled: bool
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Projects
class OrganizationBase(BaseModel):
    name: str
    is_base: bool = False

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: int
    project_id: int
    extracted_data: Optional[Any] = None
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    industry: Optional[str] = None
    region: Optional[str] = None

class ProjectCreate(ProjectBase):
    base_org: OrganizationCreate
    competitors: List[OrganizationCreate]

class Project(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    organizations: List[Organization]
    class Config:
        from_attributes = True

# Uploads
class UploadBase(BaseModel):
    filename: str
    content_type: str
    size: int

class Upload(UploadBase):
    id: int
    status: str
    s3_key: str
    project_id: int
    organization_id: Optional[int]
    class Config:
        from_attributes = True

# Analysis
class AnalysisResultBase(BaseModel):
    project_id: int
    version: int
    results_json: Any
    constraints: Optional[Any] = None

class AnalysisResult(AnalysisResultBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
