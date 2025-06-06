from __future__ import annotations
import databases
import ormar
import sqlalchemy
from datetime import date, datetime
from enum import Enum
from pydantic import BaseModel
from backend.config import settings

from typing import Optional, ForwardRef, List

# 공통 설정
database = databases.Database(settings.DATABASE_URL)
metadata = sqlalchemy.MetaData()

# ───────────── ENUM 정의 ───────────── #
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

# ───────────── 모델 정의 ───────────── #

class User(ormar.Model):
    class Meta:
        tablename = "users"
        metadata = metadata
        database = database
    id: str = ormar.String(primary_key=True, max_length=30)
    name: str = ormar.String(max_length=50, nullable=False)
    pw_hash: str = ormar.String(max_length=128, nullable=False)
    email: str = ormar.String(max_length=128, unique=True, nullable=False)

class ProjectOutline(ormar.Model):
    class Meta:
        tablename = "project_outlines"
        metadata = metadata
        database = database
    id: str = ormar.String(primary_key=True, max_length=30)
    name: str = ormar.String(max_length=100, nullable=False)
    classification: str = ormar.String(max_length=50)

class ProjectInfo(ormar.Model):
    class Meta:
        tablename = "project_infos"
        metadata = metadata
        database = database

    id: int = ormar.Integer(primary_key=True)
    project: ProjectOutline = ormar.ForeignKey(ProjectOutline)
    explain: str = ormar.Text(nullable=False)
    sign_deadline: date = ormar.Date(nullable=False)
    salary_type: SalaryType = ormar.String(max_length=20, nullable=False)
    education: Education = ormar.String(max_length=20, nullable=False)
    email: str = ormar.String(max_length=128)

    proposer: List[str] = ormar.JSON(nullable=False)
    worker: List[str] = ormar.JSON(nullable=False)
    roles: List[str] = ormar.JSON(nullable=False)

    thumbnail: str = ormar.String(max_length=255, nullable=True)

    # 추가 필드
    recruit_number: int = ormar.Integer(nullable=False, default=1)
    career: Career = ormar.String(max_length=20, nullable=False, default=Career.ANY)
    contract_until: date = ormar.Date(nullable=False)
    starred_users: List[str] = ormar.JSON(nullable=False, default=[])
    
#신청자
import ormar

class ApplyForm(ormar.Model):
    class Meta:
        tablename = "apply_forms"
        metadata = metadata
        database = database
        constraints = [ormar.UniqueColumns("user", "project")]

    id: int = ormar.Integer(primary_key=True)
    role: str = ormar.String(max_length=100, nullable=True)
    education: str = ormar.String(max_length=100, nullable=True)

    user: User = ormar.ForeignKey(User)
    project: ProjectInfo = ormar.ForeignKey(ProjectInfo)

    contact: str = ormar.Text()
    introduce: str = ormar.Text()
    uploaded_file: str = ormar.String(max_length=255, nullable=True)



class Todo(ormar.Model):
    class Meta:
        tablename = "todos"
        metadata = metadata
        database = database
    id: str = ormar.String(primary_key=True, max_length=50)
    text: str = ormar.Text(nullable=False)
    user: User = ormar.ForeignKey(User)
    deadline: date = ormar.Date(nullable=False)
    start_day: date = ormar.Date(nullable=False)

class ProjectTag(ormar.Model):
    class Meta:
        tablename = "project_tags"
        metadata = metadata
        database = database
    id: int = ormar.Integer(primary_key=True)
    tag_name: str = ormar.String(max_length=50)
    project: ProjectInfo = ormar.ForeignKey(ProjectInfo)

class Calendar(ormar.Model):
    class Meta:
        tablename = "calendar"
        metadata = metadata
        database = database
    id: str = ormar.String(primary_key=True, max_length=50)
    text: str = ormar.Text()
    dates: date = ormar.Date()
    owner: User = ormar.ForeignKey(User)
    is_repeat: bool = ormar.Boolean(default=False)
    in_project: ProjectInfo = ormar.ForeignKey(ProjectInfo, nullable=True)

class Chat(ormar.Model):
    class Meta:
        tablename = "chats"
        metadata = metadata
        database = database
    id: int = ormar.Integer(primary_key=True)
    sender: str = ormar.String(max_length=30)
    receiver: str = ormar.String(max_length=30)
    message: str = ormar.Text()
    timestamp: datetime = ormar.DateTime(default=datetime.utcnow)


class UserProfile(ormar.Model):
    class Meta:
        tablename = "user_profiles"
        metadata = metadata
        database = database

    id: int = ormar.Integer(primary_key=True)
    user: User = ormar.ForeignKey(User, unique=True)  # 1:1 관계
    profile_image: str = ormar.String(max_length=255, nullable=True)
    tech_stack: list = ormar.JSON(nullable=True, default=[])
    tags: list = ormar.JSON(nullable=True, default=[])
    education: Education = ormar.String(max_length=20, nullable=True)
    intro: str = ormar.Text(nullable=True)
    career_summary: str = ormar.String(max_length=255, nullable=True)
    phone: str = ormar.String(max_length=30, nullable=True)
    location: str = ormar.String(max_length=100, nullable=True)
    birth: date = ormar.Date(nullable=True)
    portfolio_url: str = ormar.String(max_length=255, nullable=True)
    is_public: bool = ormar.Boolean(default=True)

class ParticipationHistory(ormar.Model):
    class Meta:
        tablename = "participation_histories"
        metadata = metadata
        database = database

    id: int = ormar.Integer(primary_key=True)
    user_profile: UserProfile = ormar.ForeignKey(UserProfile)
    company: str = ormar.String(max_length=100)
    title: str = ormar.String(max_length=100)
    description: str = ormar.Text(nullable=True)
    start_date: date = ormar.Date()
    end_date: date = ormar.Date(nullable=True)

class ProjectParticipation(ormar.Model):
    class Meta:
        tablename = "project_participations"
        metadata = metadata
        database = database

    id: int = ormar.Integer(primary_key=True)
    user_profile: UserProfile = ormar.ForeignKey(UserProfile)
    project: ProjectInfo = ormar.ForeignKey(ProjectInfo)
    joined_at: date = ormar.Date()
    left_at: date = ormar.Date(nullable=True)

#건들 ㄴㄴ
ProjectFolderRef = ForwardRef("ProjectFolder")

#폴더 관리용

class ProjectFolder(ormar.Model):
    class Meta:
        tablename = "project_folders"
        metadata = metadata
        database = database

    id: int = ormar.Integer(primary_key=True)
    name: str = ormar.String(max_length=255, nullable=False)
    created_at: datetime = ormar.DateTime(default=datetime.utcnow)
    project: ProjectInfo = ormar.ForeignKey(ProjectInfo)
    parent_id: Optional[int] = ormar.Integer(nullable=True)  

class UploadedFile(ormar.Model):
    class Meta:
        tablename = "uploaded_files"
        metadata = metadata
        database = database 
    id: int = ormar.Integer(primary_key=True)
    name: str = ormar.String(max_length=255)
    s3_key: str = ormar.String(max_length=255)
    s3_url: str = ormar.String(max_length=1000)
    size: int = ormar.Integer(nullable=True) 
    uploader: User = ormar.ForeignKey(User)
    project: ProjectInfo = ormar.ForeignKey(ProjectInfo)
    folder: Optional[ProjectFolder] = ormar.ForeignKey(ProjectFolder, nullable=True) 
    uploaded_at: datetime = ormar.DateTime(default=datetime.utcnow)



class UserProfile(ormar.Model):
    class Meta:
        tablename = "user_profiles"
        metadata = metadata
        database = database

    id: int = ormar.Integer(primary_key=True)
    user: User = ormar.ForeignKey(User, unique=True)  # 1:1 관계
    profile_image: str = ormar.String(max_length=255, nullable=True)
    tech_stack: list = ormar.JSON(nullable=True, default=[])
    tags: list = ormar.JSON(nullable=True, default=[])
    education: Education = ormar.String(max_length=20, nullable=True)
    intro: str = ormar.Text(nullable=True)
    career_summary: str = ormar.String(max_length=255, nullable=True)
    phone: str = ormar.String(max_length=30, nullable=True)
    location: str = ormar.String(max_length=100, nullable=True)
    birth: date = ormar.Date(nullable=True)
    portfolio_url: str = ormar.String(max_length=255, nullable=True)
    is_public: bool = ormar.Boolean(default=True)

class ParticipationHistory(ormar.Model):
    class Meta:
        tablename = "participation_histories"
        metadata = metadata
        database = database

    id: int = ormar.Integer(primary_key=True)
    user_profile: UserProfile = ormar.ForeignKey(UserProfile)
    company: str = ormar.String(max_length=100)
    title: str = ormar.String(max_length=100)
    description: str = ormar.Text(nullable=True)
    start_date: date = ormar.Date()
    end_date: date = ormar.Date(nullable=True)

class ProjectParticipation(ormar.Model):
    class Meta:
        tablename = "project_participations"
        metadata = metadata
        database = database

    id: int = ormar.Integer(primary_key=True)
    user_profile: UserProfile = ormar.ForeignKey(UserProfile)
    project: ProjectInfo = ormar.ForeignKey(ProjectInfo)
    joined_at: date = ormar.Date()
    left_at: date = ormar.Date(nullable=True)








# ───────────── 테이블 생성 ───────────── #
engine = sqlalchemy.create_engine(settings.DATABASE_URL)
metadata.create_all(engine)
