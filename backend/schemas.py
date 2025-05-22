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
    id: str  # 프로젝트 생성자 ID (만약 서버에서 생성한다면 제거)
    name: str
    project: str
    explain: str
    sign_deadline: date
    salary_type: SalaryType
    education: Education
    email: EmailStr
    proposer: str
    worker: str
    thumbnail: Optional[str] = None


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
    salary_type: SalaryType
    education: Education
    email: EmailStr
    proposer: str
    worker: str
    thumbnail: Optional[str] = None

    class Config:
        orm_mode = True


class UserCreate(BaseModel):
    id: str
    name: str
    password: str  # 원본 비밀번호를 받고 서버에서 해싱 권장
    email: EmailStr


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    id: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
