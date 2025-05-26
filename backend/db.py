import databases
import ormar
import sqlalchemy
from datetime import date, datetime
from enum import Enum
from pydantic import BaseModel
from backend.config import settings

# 공통 설정
database = databases.Database(settings.DATABASE_URL)
metadata = sqlalchemy.MetaData()

# ───────────── ENUM 정의 ───────────── #
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
    proposer: str = ormar.String(max_length=30)
    worker: str = ormar.String(max_length=30)
    thumbnail: str = ormar.String(max_length=255, nullable=True)


class UploadedFile(ormar.Model):
    class Meta:
        tablename = "uploaded_files"
        metadata = metadata
        database = database
    id: int = ormar.Integer(primary_key=True)
    name: str = ormar.String(max_length=255)
    extension: str = ormar.String(max_length=10)
    owner: User = ormar.ForeignKey(User)
    project: ProjectOutline = ormar.ForeignKey(ProjectOutline)
    comment_user: str = ormar.String(max_length=30)
    comment_text: str = ormar.Text()
    performance: bool = ormar.Boolean(default=False)

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
    project: ProjectOutline = ormar.ForeignKey(ProjectOutline)

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
    in_project: ProjectOutline = ormar.ForeignKey(ProjectOutline, nullable=True)

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

# ───────────── 테이블 생성 ───────────── #
engine = sqlalchemy.create_engine(settings.DATABASE_URL)
metadata.create_all(engine)
