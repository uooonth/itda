from pydantic import BaseModel, EmailStr
from datetime import date, datetime
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
    time: datetime

class FeedbackChatMessage(BaseModel):
    feedback_id: str
    sender_id: str
    sender_name: str
    text: str
    time: datetime

"""
class LiveChatMessage(BaseModel):
    sender_id: str
    receiver_id: str
    text: str
    time: datetime
"""