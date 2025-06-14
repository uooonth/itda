from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from enum import Enum
from typing import Union, List, Optional
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

class ScheduleUpdate(BaseModel):
    start_day: Optional[str]
    deadline: Optional[str]

class AcceptRequest(BaseModel):
    user_id: str

class RejectRequest(BaseModel):
    user_id: str    

class ParticipationHistorySchema(BaseModel):
    company: str
    title: str
    description: Optional[str] = ""
    start_date: date
    end_date: Optional[date] = None

class ProjectParticipationSchema(BaseModel):
    project_id: str
    joined_at: date
    left_at: Optional[date] = None

class UserProfileCreate(BaseModel):
    profile_image: Optional[str] = None
    tech_stack: List[str] = []
    tags: List[str] = []
    education: Optional[str] = None
    intro: Optional[str] = ""
    career_summary: Optional[str] = ""
    phone: Optional[str] = None
    location: Optional[str] = None
    birth: Optional[date] = None
    portfolio_url: Optional[str] = None
    is_public: bool = True
    participation_history: List[ParticipationHistorySchema] = []
    project_participations: List[ProjectParticipationSchema] = []

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
    user_id: Union[str, List[str]]  # 단일 또는 다중 담당자 지원
    deadline: Optional[str] = None
    start_day: Optional[str] = None
    project_id: str
    status: str = "in_progress"

class TodoResponse(BaseModel):
    id: str
    text: str
    user_id: Union[str, List[str]]  # 단일 또는 다중 담당자 지원
    deadline: str
    start_day: str
    project_id: str
    status: str

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
    user_id: str  # 사용자 ID
    is_repeat: Optional[bool] = False
    in_project: Optional[str] = None 
    color: Optional[str] = "#3174ad"
    created_at: Optional[datetime] = None 

class CalendarDelete(BaseModel):
    user_id: str
    created_at: Optional[datetime] = None 

class ChatMessage(BaseModel):
    project_id: str
    sender_id: str
    sender_name: str
    text: str

class ChatRoomCreateRequest(BaseModel):
    name: str
    member_ids: List[str]

class ScheduleUpdate(BaseModel):
    start_day: Optional[str]
    deadline: Optional[str]
    

class ParticipationHistorySchema(BaseModel):
    company: str
    title: str
    description: Optional[str] = ""
    start_date: date
    end_date: Optional[date] = None
