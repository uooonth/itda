from pydantic import BaseModel, EmailStr
from datetime import date
from enum import Enum
from typing import Optional


    
class SalaryType(str, Enum):
    MONTHLY = "월급"
    WEEKLY = "주급"
    UNPAID = "무급"
    ANNUAL = "연봉"
    PER_TASK = "건당"

class Education(str, Enum):
    HIGH = "고졸"
    COLLEGE = "대졸"
    ELEMENTARY = "초졸"
    MIDDLE = "중졸"
    NONE = "무관"

class ProjectCreate(BaseModel):
    id: str            # 만든 사람 id (ProjectOutline용)
    name: str          # 프로젝트 이름 (ProjectOutline용)
    project: str       # 프로젝트 ID (ProjectInfo 외래키용)
    explain: str
    sign_deadline: date
    salary_type: SalaryType
    education: Education
    email: str
    proposer: str
    worker: str
    thumbnail: str | None = None


class ProjectOutlineOut(BaseModel):
    id: str
    name: str
    classification: str

    class Config:
        orm_mode = True

class ProjectOut(BaseModel):
    id: int
    project: ProjectOutlineOut
    explain: str
    sign_deadline: date
    salary_type: str
    education: str
    email: str
    proposer: str
    worker: str
    thumbnail: Optional[str] = None

    class Config:
        orm_mode = True
        
        
        
class UserCreate(BaseModel):
    id: str
    name: str
    pw_hash: str 
    email: EmailStr


class UserResponse(BaseModel):
    id: str
    email: str
    name: str

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    id: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


class TodoCreate(BaseModel):
    text: str
    user_id: str
    deadline: str
    start_day: str
    project_id: str
    
    
class TodoResponse(BaseModel):
    id: str
    text: str
    user_id: str
    deadline: str
    start_day: str
    project_id: Optional[str] = None


class UploadedFileCreate(BaseModel):
    name: str
    extension: str
    owner_id: str
    project_id: int
    comment_user: str
    comment_text: str
    performance: bool = False
