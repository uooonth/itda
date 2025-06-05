from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from enum import Enum
from typing import Optional, List

class SalaryType(str, Enum):
    HOURLY = "시급"
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

class Career(str, Enum):
    NEW = "신입"
    EXPERIENCED = "경력"
    ANY = "무관"


class ProjectCreate(BaseModel):
    id: str
    name: str
    classification: Optional[str] = "default"
    explain: str
    sign_deadline: date
    salary_type: SalaryType
    education: Education
    email: EmailStr
    proposer: List[str]
    worker: List[str]
    roles: List[str]
    thumbnail: Optional[str] = None

    # 추가 필드
    recruit_number: int                          # 모집 인원 수
    career: Career                               # 경력 조건
    contract_until: date                         # 계약 종료일 (언제까지 같이 일할지)
    starred_users: Optional[List[str]] = []


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
    proposer: List[str]
    worker: List[str]
    roles: List[str]
    thumbnail: Optional[str] = None

    # 추가 필드
    recruit_number: int
    career: Career
    contract_until: date

    starred_users: List[str] = []

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
class CalendarCreate(BaseModel):
    text: str
    start: datetime
    end: datetime
    owner: str  # 사용자 ID
    is_repeat: Optional[bool] = False
    in_project: Optional[str] = None 

class ChatMessage(BaseModel):
    project_id: str
    sender_id: str
    sender_name: str
    text: str

class FeedbackChatMessage(BaseModel):
    feedback_id: str
    sender_id: str
    sender_name: str
    text: str
    time: datetime

