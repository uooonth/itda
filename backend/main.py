from fastapi import FastAPI,status,Depends, APIRouter,Body,Request
from backend.schemas import ScheduleUpdate,UserProfileCreate,UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, ProjectOut
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, CalendarCreate, ChatMessage, UploadedFileCreate,TodoResponse,TodoCreate,CalendarDelete,ChatRoomCreateRequest
from backend.db import database,ParticipationHistory, ProjectParticipation,UserProfile,User,ProjectInfo, ProjectOutline, UploadedFile, Calendar, Chat, Todo,ProjectFolder, UserProfile,ApplyForm,ChatRoom,ChatRoomMessage
import mimetypes
import urllib.parse
import base64
from backend.db import Calendar as CalendarModel
from uuid import uuid4
from contextlib import asynccontextmanager
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, CalendarCreate, ChatMessage,UploadedFileCreate,TodoResponse,TodoCreate,CalendarDelete, AcceptRequest, RejectRequest

from fastapi import HTTPException
from typing import List
from fastapi import Path,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional
from fastapi.security import OAuth2PasswordBearer
from fastapi import Query
from .email_routes import router as email_router
from ormar.exceptions import NoMatch
from backend.redisClass import Notice,r,FeedbackStore,FeedbackMessage,TodoProgressStore,TodoStyleStore,TodoParticipantStore,ChatStore
from fastapi.responses import StreamingResponse
import io

import redis
import json
from fastapi import File, UploadFile, Form, Depends, FastAPI, WebSocket, WebSocketDisconnect
from datetime import date
from fastapi.staticfiles import StaticFiles
import shutil
from zoneinfo import ZoneInfo
from pathlib import Path as FilePath


import boto3
import os
from botocore.client import Config

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
    config=Config(signature_version="s3v4") 
)

BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

# ───────────── Docker 생명주기 설정 ───────────── #
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)


# ───────────── 3000포트에서 이쪽 주소를 쓸 수 있게 해주는 CORS설정 ───────────── #
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ───────────── 회원가입 API ───────────── #
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


@app.post("/signup", response_model=UserCreate)
async def signup(request: Request):
    data = await request.json()

    user = UserCreate(
        id=data["id"],
        name=data["name"],
        password=data["pw_hash"],
        email=data["email"]
    )

    hashed_password = user.password

    existing_user = await User.objects.get_or_none(email=user.email)

    # #####################################################
    # 배포시에 빼기 #######################################3
    #################################################
    email_to_store = user.email if not existing_user else "placeholder2@example.com"

    new_user = await User.objects.create(
        id=user.id,
        name=user.name,
        pw_hash=hashed_password,
        email=email_to_store
    )

    await UserProfile.objects.create(
        user=new_user,
        profile_image=None,
        tech_stack=[],
        tags=[],
        education=None,
        intro="",
        career_summary="",
        phone=None,
        location=None,
        birth=None,
        portfolio_url=None,
        is_public=True,
        pinned_projects=[]
    )
    return user


@app.get("/check-id")
async def check_id(id: str = Query(..., min_length=3, max_length=20)):
    existing_user = await User.objects.get_or_none(id=id)
    return {"is_duplicate": existing_user is not None}

@app.get("/check-nickname")
async def check_nickname(nickname: str = Query(..., min_length=2, max_length=20)):
    existing_user = await User.objects.get_or_none(name=nickname)
    return {"is_duplicate": existing_user is not None}


## ───────────── token API ───────────── #
SECRET_KEY = "jongseolpw12345612345678901234567890"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
UTC = timezone.utc  
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(tz=UTC) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")  
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="증명틀렸습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await User.objects.get_or_none(id=user_id)
    if user is None:
        raise credentials_exception

    return user

app.include_router(email_router, prefix="/email")

## ───────────── login API ───────────── #
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

@app.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    print(user_credentials)

    user = await User.objects.get_or_none(id=user_credentials.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="id실수"
        )



    # 토큰 생성
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ───────────── 로그인확인용(not프론트연결) API ───────────── #
from typing import Annotated
@app.get("/me", response_model=UserResponse)
async def get_user_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
@app.get("/getUsers", response_model=List[User])
async def get_users():
    users = await User.objects.all()
    return users

# ───────────── 플젝 API ───────────── #
@app.get("/getProjects", response_model=List[ProjectOut])
async def get_projects():
    projects = await ProjectInfo.objects.select_related("project").all()
    return projects

from fastapi import HTTPException



#───────────── 프로젝트 생성 ─────────────#
import os

# static/uploads 경로가 없으면 생성
os.makedirs("static/uploads", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/projects", response_model=ProjectOut)
async def create_project(
    id: str = Form(...),
    name: str = Form(...),
    classification: str = Form(...),
    explain: str = Form(...),
    sign_deadline: date = Form(...),
    salary_type: str = Form(...),
    education: str = Form(...),
    email: str = Form(...),
    proposer: str = Form(...),  # JSON string
    worker: str = Form(...),
    roles: str = Form(...),
    recruit_number: int = Form(...),
    career: str = Form(...),
    contract_until: date = Form(...),
    thumbnail: UploadFile = File(None)
):
    # JSON 필드들 디코딩
    proposer_list = json.loads(proposer)
    worker_list = json.loads(worker)
    roles_list = json.loads(roles)

    # 유저 존재 여부 확인
    for proposer_id in proposer_list:
        if not await User.objects.get_or_none(id=proposer_id):
            raise HTTPException(400, f"프로포저 '{proposer_id}' 없음")
    for worker_id in worker_list:
        if not await User.objects.get_or_none(id=worker_id):
            raise HTTPException(400, f"워커 '{worker_id}' 없음")

    # 썸네일 저장
    thumbnail_url = None
    if thumbnail:
        content = await thumbnail.read()
        filename = f"{uuid.uuid4().hex}_{thumbnail.filename}"
        save_path = f"static/uploads/{filename}"
        with open(save_path, "wb") as f:
            f.write(content)
        thumbnail_url = f"/static/uploads/{filename}"

    # Outline 생성 또는 get
    outline = await ProjectOutline.objects.get_or_none(id=id)
    if not outline:
        outline = await ProjectOutline.objects.create(id=id, name=name, classification=classification)


    new_project = await ProjectInfo.objects.create(
        project=outline,
        explain=explain,
        sign_deadline=sign_deadline,
        salary_type=salary_type,
        education=education,
        email=email,
        proposer=proposer_list,
        worker=worker_list,
        roles=roles_list,
        thumbnail=thumbnail_url,
        recruit_number=recruit_number,
        career=career,
        contract_until=contract_until,
        starred_users=[]
    )

    return await ProjectInfo.objects.select_related("project").get(id=new_project.id)


router = APIRouter()

@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project_detail(project_id: int):
    try:
        project = await ProjectInfo.objects.select_related("project").get(id=project_id)
    except NoMatch:
        raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")
    
    return project

# 앱에 등록
app.include_router(router)

# 플젝 삭제
@app.delete("/projects/{project_id}")
async def delete_project(project_id: int, current_user: User = Depends(get_current_user)):
    project = await ProjectInfo.objects.get_or_none(id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    
    if current_user.id != project.proposer[0]:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    await ApplyForm.objects.filter(project=project).delete()
    
    await UploadedFile.objects.filter(project=project).delete()

    await ProjectParticipation.objects.filter(project=project).delete()

    await project.delete()
    
    return {"detail": "삭제 성공"}



#찜
@app.post("/projects/{project_id}/star")
async def toggle_star(
    project_id: int,
    current_user: User = Depends(get_current_user)
):
    project = await ProjectInfo.objects.get_or_none(id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    user_id = current_user.id
    starred = project.starred_users or []

    if user_id in starred:
        starred.remove(user_id)
        is_starred = False
    else:
        starred.append(user_id)
        is_starred = True

    project.starred_users = starred
    await project.update()

    return {
        "isStarred": is_starred,
        "starCount": len(starred)
    }
    
#신청
@router.post("/apply/{project_id}")
async def apply_to_project(
    project_id: int,
    role: str = Form(...),
    education: str = Form("무관"),
    contact: str = Form(...),
    introduce: str = Form(...),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    # 중복 지원 방지
    existing = await ApplyForm.objects.get_or_none(user=current_user, project__id=project_id)
    if existing:
        raise HTTPException(status_code=400, detail="이미 이 프로젝트에 지원했습니다.")

    UPLOAD_DIR = "static/uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    filename = None
    if file:
        ext = file.filename.split(".")[-1]
        filename = f"{uuid4().hex}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    project = await ProjectInfo.objects.get_or_none(id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="해당 프로젝트가 존재하지 않습니다.")

    apply_form = await ApplyForm.objects.create(
        role=role,
        education=education,
        contact=contact,
        introduce=introduce,
        uploaded_file=filename,
        user=current_user,
        project=project
    )
    if current_user.id not in project.proposer:
        project.proposer.append(current_user.id)
        await project.update()


    return {"message": "지원이 성공적으로 완료되었습니다."}

#수락 
@router.post("/{project_id}/accept")
async def accept_applicant(project_id: int, req: AcceptRequest):
    user_id = req.user_id
    project = await ProjectInfo.objects.get(id=project_id)
    user = await User.objects.get(id=user_id)
    user_profile = await UserProfile.objects.get(user=user)

    await ProjectParticipation.objects.create(
        user_profile=user_profile,
        project=project,
        joined_at=date.today()
    )
    await ApplyForm.objects.filter(user=user, project=project).delete()
    
    if user_id not in project.worker:
        project.worker.append(user_id)
        await project.update()


# 거절
@router.post("/{project_id}/reject")
async def reject_applicant(project_id: int, req: RejectRequest):
    user_id = req.user_id

    project = await ProjectInfo.objects.get(id=project_id)
    user = await User.objects.get(id=user_id)

    await ApplyForm.objects.filter(user=user, project=project).delete()

    return {"status": "rejected"}


@router.get("/{project_id}/applicants")
async def get_applicants(project_id: int):
    project = await ProjectInfo.objects.get(id=project_id)
    worker_ids = project.worker

    apply_forms = await ApplyForm.objects.select_related("user").filter(project__id=project_id).all()

    result = []
    for form in apply_forms:
        if form.user.id in worker_ids:
            continue  # 승인된 사람 제외시키기
        result.append({
            "user_id": form.user.id,
            "name": form.user.name,
            "email": form.user.email,
            "role": form.role,
            "introduce": form.introduce,
            "contact": form.contact,
        })

    return result


app.include_router(router, prefix="/projects")

# ───────────── 플젝 탭 API ───────────── #
@app.get("/project/{project_id}", response_model=ProjectOut)
async def get_project_detail(project_id: str = Path(...)):
    project_info = await ProjectInfo.objects.select_related(
        "project"
    ).get_or_none(project=project_id)

    if not project_info:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    
    return project_info


# ───────────── 플젝-공지-redis ───────────── #

# 공지사항 생성 API
@app.post("/project/{project_id}/notice")
async def create_notice(project_id: str, notice: Notice):
    redis_key = f"project:공지:{project_id}"
    await r.set(redis_key, notice.content)
    return project_id


# 공지사항 가져오기 API
@app.get("/project/{project_id}/notice")
async def get_notice(project_id: str):
    redis_key = f"project:공지:{project_id}"
    notice = await r.get(redis_key)
    if notice:
        return {"project_id": project_id, "content": notice}  
    else:
        raise HTTPException(status_code=404, detail="공지사항이 없습니다.")
    
    
# ───────────── 플젝-투두-postgreSQL,redis ───────────── #


@app.put("/todos/{todo_id}")
async def update_todo(todo_id: str, update_data: dict):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    try:
        # 기본 정보 업데이트
        if "text" in update_data:
            todo.text = update_data["text"]
        if "deadline" in update_data:
            todo.deadline = update_data["deadline"]
        if "start_day" in update_data:
            todo.start_day = update_data["start_day"]
        
        await todo.update()
        
        # 담당자 정보는 Redis에서 별도 관리
        if "user_id" in update_data:
            user_ids = update_data["user_id"]
            if not isinstance(user_ids, list):
                user_ids = [user_ids] if user_ids else []
            
            # Redis에 담당자 정보 저장
            await TodoParticipantStore.set_participants(todo_id, user_ids)
        
        return {"message": "할 일이 성공적으로 수정되었습니다."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"수정 실패: {str(e)}")



@app.get("/todos")
async def get_all_todos():
    todos = await Todo.objects.all()
    return todos
@app.get("/projects/{project_id}/todos/status/{status}")
async def get_todos_by_status_and_project(project_id: str, status: str):
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="유효하지 않은 status")
    result = []
    todo_ids = await r.smembers(f"project:{project_id}:todos")
    for todo_id in todo_ids:
        status_value = await r.get(f"todo_status:{todo_id}")
        if status_value and status_value == status:
            result.append(todo_id)
    return result


# 투두 프로젝트 별 가져오기 api
@app.get("/projects/{project_id}/todos")
async def get_project_todos(project_id: str):
    todo_ids = await r.smembers(f"project:{project_id}:todos")
    todos = []
    for todo_id in todo_ids:
        todo = await Todo.objects.get_or_none(id=todo_id)
        if not todo:
            continue
        participants = await TodoParticipantStore.get_participants(todo_id)
        status = await r.get(f"todo_status:{todo_id}") or "in_progress"
        todos.append({
            "id": todo.id,
            "text": todo.text,
            "user_id": participants,
            "deadline": str(todo.deadline),
            "start_day": str(todo.start_day),
            "status": status
        })
    return todos


# 투두 삭제 API
@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, project_id: str):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo를 찾을 수 없습니다")
    await todo.delete()
    await r.delete(f"todo_status:{todo_id}")
    await r.srem(f"project:{project_id}:todos", todo_id)
    await TodoProgressStore.delete_progress(todo_id)
    return {"message": f"{todo_id} 삭제 완료"}




# ───────────── 플젝-투두-상태변경crud───────────── #
VALID_STATUSES = ["in_progress", "completed", "waiting_feedback"]

# ───────────── Redis 헬퍼 함수 ───────────── #
async def get_project_id_of_todo(todo_id: str) -> Optional[str]:
    todo = await Todo.objects.select_related("user").get_or_none(id=todo_id)
    return getattr(todo, "project_id", None)


# ───────────── Todo 생성 ───────────── #
@app.post("/todos", response_model=dict)
async def create_todo(todo: TodoCreate):
    todo_id = str(uuid.uuid4())
    if todo.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    user_ids = todo.user_id if isinstance(todo.user_id, list) else [todo.user_id] if todo.user_id else []
    primary_user_id = user_ids[0] if user_ids else None
    if not primary_user_id:
        raise HTTPException(status_code=400, detail="최소 한 명의 담당자가 필요합니다.")
    primary_user = await User.objects.get_or_none(id=primary_user_id)
    if not primary_user:
        raise HTTPException(status_code=400, detail="유효하지 않은 사용자 ID입니다.")
    new_todo = await Todo.objects.create(
        id=todo_id,
        text=todo.text,
        user=primary_user,  # 첫 번째 사용자만 DB에 저장
        deadline=todo.deadline,
        start_day=todo.start_day
    )
    await TodoParticipantStore.set_participants(todo_id, user_ids)
    await r.sadd(f"project:{todo.project_id}:todos", todo_id)
    await r.set(f"todo_status:{todo_id}", todo.status)
    await TodoProgressStore.set_progress(todo_id, 0)
    return {
        "id": new_todo.id,
        "text": new_todo.text,
        "user_id": user_ids,
        "deadline": str(todo.deadline),
        "start_day": str(todo.start_day),
        "project_id": todo.project_id,
        "status": todo.status
    }



# ───────────── Todo 조회 ───────────── #
@app.get("/projects/{project_id}/todos", response_model=List[TodoResponse])
async def get_todos_by_project(project_id: str):
    todo_ids = await r.smembers(f"project:{project_id}:todos")
    
    result = []
    for todo_id in todo_ids:
        todo = await Todo.objects.get_or_none(id=todo_id)
        if todo:
            status_bytes = await r.get(f"todo_status:{todo_id}")
            status = status_bytes.decode("utf-8") if isinstance(status_bytes, bytes) else status_bytes or "in_progress"

            result.append(TodoResponse(
                id=todo.id,
                text=todo.text,
                user_id=todo.user.id,
                deadline=str(todo.deadline),
                start_day=str(todo.start_day),
                project_id=project_id,
                status=status  #
            ))
    return result



@app.get("/projects/{project_id}/todos/status/{status}", response_model=List[str])
async def get_todos_by_status_and_project(project_id: str, status: str):
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="유효 ㄴ status")

    result = []
    todo_ids = await r.smembers(f"project:{project_id}:todos")
    for todo_id in todo_ids:
        status_value = await r.get(f"todo_status:{todo_id}")
        if status_value and status_value == status:
            result.append(todo_id)
    return result


# ───────────── Todo 상태 변경 ───────────── #
@app.post("/todos/{todo_id}/status")
async def set_todo_status(todo_id: str, status: str = Query(...)):
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="status 오류")
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo를 찾을 수 없습니다")
    await r.set(f"todo_status:{todo_id}", status)
    project_id = await get_project_id_of_todo(todo_id)
    if project_id:
        await r.sadd(f"project:{project_id}:todos", todo_id)
    return {"message": "상태 변경 완료"}



@app.get("/todos/{todo_id}/status")
async def get_todo_status(todo_id: str):
    status = await r.get(f"todo_status:{todo_id}")
    if not status:
        raise HTTPException(status_code=404, detail="스태터스못찾")
    return {"todo_id": todo_id, "status": status}






@app.put("/todos/{todo_id}/schedule", response_model=TodoResponse)
async def update_todo_schedule(todo_id: str, schedule: ScheduleUpdate = Body(...)):
    todo = await Todo.objects.select_related("user").get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    update_fields = {}
    if schedule.start_day is not None:
        update_fields["start_day"] = schedule.start_day
    if schedule.deadline is not None:
        update_fields["deadline"] = schedule.deadline

    for field, value in update_fields.items():
        setattr(todo, field, value)

    await todo.update()

    status_bytes = await r.get(f"todo_status:{todo_id}")
    status = status_bytes.decode("utf-8") if isinstance(status_bytes, bytes) else status_bytes or "in_progress"

    return TodoResponse(
        id=todo.id,
        text=todo.text,
        user_id=todo.user.id,
        start_day=str(todo.start_day),
        deadline=str(todo.deadline),
        project_id="",  # 현재 접근 불가한 경우
        status=status
    )



# ───────────── 플젝-피드백-업로드 파일 crud ───────────── #
from .s3 import s3, BUCKET_NAME
import uuid
from fastapi import UploadFile, File
#객체조회
@app.get("/projects/{project_id}/files")
async def get_project_files(project_id: int):
    files = await UploadedFile.objects.filter(project__id=project_id).all()
    return [
        {
            "id": f.id,
            "key": f.s3_key,
            "url": f.s3_url,
            "name": f.name,
            "uploaded_at": f.uploaded_at.isoformat(),
            "size": f.size,
            "folder_id": f.folder.id if f.folder else None,
            "uploader": {
                "id": f.uploader.id 
            } if f.uploader else None,        }
        for f in files
    ]

from datetime import datetime

#s3에 업로드 api
from fastapi import Form
@app.post("/upload/s3/{project_id}")
async def upload_s3(
    project_id: int,
    file: UploadFile = File(...),
    folder_id: int = Form(None),
    uploader: str = Form(...)):
    file_content = await file.read()
    extension = file.filename.split('.')[-1]
    s3_key = f"uploads/{uuid.uuid4()}.{extension}"

    s3.put_object(
        Bucket=BUCKET_NAME,Key=s3_key,Body=file_content,ContentType=file.content_type
    )

    s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

    project = await ProjectInfo.objects.get(id=project_id)
    folder = await ProjectFolder.objects.get(id=folder_id) if folder_id else None

    saved = await UploadedFile.objects.create(
        name=file.filename,
        s3_key=s3_key,
        s3_url=s3_url,
        size=len(file_content),  
        project=project,
        folder=folder,
        uploader=uploader,
        uploaded_at=datetime.utcnow()
    )

    return {"file_id": saved.id, "url": s3_url}

#수정
@app.put("/upload/s3/{file_id}")
async def update_file(file_id: int, file: UploadFile = File(...)):
    from datetime import datetime

    old_file = await UploadedFile.objects.select_related("project").get(id=file_id)
    if not old_file:
        raise HTTPException(status_code=404, detail="기존 파일을 찾을 수 없습니다")

    extension = file.filename.split('.')[-1]
    new_key = f"uploads/{uuid.uuid4()}.{extension}"

    # 파일 전체 읽기 및 사이즈 측정
    file_content = await file.read()
    file_size = len(file_content)

    # S3에 새 파일 업로드
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=new_key,
        Body=file_content,
        ContentType=file.content_type
    )

    new_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{new_key}"

    # 기존 파일 정보 업데이트
    old_file.name = file.filename
    old_file.s3_key = new_key
    old_file.s3_url = new_url
    old_file.uploaded_at = datetime.utcnow()
    old_file.size = file_size
    await old_file.update()

    return {
        "id": old_file.id,
        "name": old_file.name,
        "s3_url": old_file.s3_url,
        "uploaded_at": old_file.uploaded_at.isoformat(),
        "size": file_size,
    }

#삭제
@app.delete("/files/{file_id}")
async def delete_file(file_id: int):
    file = await UploadedFile.objects.get_or_none(id=file_id)
    if not file:
        raise HTTPException(status_code=404, detail="zz404")
    #S3삭제
    print("🔍 S3 삭제 시도:", file.s3_key)
    s3.delete_object(Bucket=BUCKET_NAME, Key=file.s3_key)
 

    #DB삭제
    await file.delete()

    return {"detail": "ㅇㅇ"}

@app.get("/projects", response_model=List[ProjectOut])
async def get_all_projects():
    projects = await ProjectInfo.objects.select_related("project").all()
    return projects


#=======================================================#
# ─────────────            s3설정          ───────────── #
#========================================================#


#백엔드에서 s3에 파일 업로드
@app.post("/upload/s3")
async def upload_to_s3(file: UploadFile = File(...)):
    file_content = await file.read()
    extension = file.filename.split('.')[-1]
    s3_key = f"uploads/{uuid.uuid4()}.{extension}"  

    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=file_content,
        ContentType=file.content_type
    )

    file_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
    return {"url": file_url, "key": s3_key}


#s3삭제

@app.delete("/delete/s3/{file_id}")
async def delete_file(file_id: int):
    file = await UploadedFile.objects.get_or_none(id=file_id)
    if not file:
        raise HTTPException(status_code=404, detail="파일에러")
    
    try:
        # S3에서 삭제
        s3.delete_object(Bucket=BUCKET_NAME, Key=file.s3_key)
        
        # DB에서 삭제
        await file.delete()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"삭제 중 오류, {str(e)}")


@app.post("/projects/{project_id}/folders")
async def create_folder(project_id: int, folder_data: dict):
    name = folder_data.get("name")
    parent_id = folder_data.get("parent_id")

    project = await ProjectInfo.objects.get(id=project_id)

    # 1 폴더 생성
    folder = await ProjectFolder.objects.create(
        name=name,
        project=project,
    )

    # 2 parent_id를 수동으로 update
    if parent_id:
        folder.parent_id = parent_id
        await folder.update()

    return {
        "id": folder.id,
        "name": folder.name,
        "created_at": folder.created_at,
        "parent_id": folder.parent_id
    }



@app.get("/projects/{project_id}/folders/tree")
async def get_folder_tree(project_id: int):
    folders = await ProjectFolder.objects.filter(project__id=project_id).all()
    files = await UploadedFile.objects.select_related("folder").filter(project__id=project_id).all()

    folder_map = {
        folder.id: {
            "id": folder.id,
            "name": folder.name,
            "createdAt": folder.created_at,
            "project_id": folder.project.id,
            "files": [],
            "children": [],
            "parent_id": folder.parent_id
        }
        for folder in folders
    }

    for file in files:
        if file.folder and file.folder.id in folder_map:
            folder_map[file.folder.id]["files"].append({
                "id": file.id,
                "name": file.name,
                "s3_url": file.s3_url,
                "uploaded_at": file.uploaded_at,
                "size": file.size  
            })

    root_folders = []
    for folder in folder_map.values():
        parent_id = folder["parent_id"]
        if parent_id and parent_id in folder_map:
            folder_map[parent_id]["children"].append(dict(folder))
        else:
            root_folders.append(folder)

    return root_folders

@app.delete("/projects/{project_id}/folders/{folder_id}")
async def delete_folder(project_id: int, folder_id: int):
    folder = await ProjectFolder.objects.get_or_none(id=folder_id, project__id=project_id)
    if not folder:
        raise HTTPException(status_code=404, detail="해당 폴더를 찾을 수 없습니다.")

    files = await UploadedFile.objects.filter(folder__id=folder_id).all()
    for file in files:
        try:
            s3.delete_object(Bucket=BUCKET_NAME, Key=file.s3_key)
        except Exception:
            pass
        await file.delete()

    child_folders = await ProjectFolder.objects.filter(parent_id=folder_id).all()
    for child in child_folders:
        await delete_folder(project_id, child.id)

    await folder.delete()
    return {"message": "폴더 및 그 하위 항목이 삭제되었습니다."}



def generate_presigned_url(bucket_name, object_key, expiration=50000):
    response = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket_name, 'Key': object_key},
        ExpiresIn=expiration
    )
    print("itda bucket:", object_key)
    return response


@app.get("/files/presigned/{file_id}")
async def get_presigned_url(file_id: int):
    file = await UploadedFile.objects.get_or_none(id=file_id)
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    
    presigned_url = generate_presigned_url(BUCKET_NAME, file.s3_key)
    if not presigned_url:
        raise HTTPException(status_code=500, detail="Presigned URL 생성 실패")

    return {"url": presigned_url}




# 채팅 레디스
@app.post("/projects/{project_id}/files/{file_id}/feedback")
async def post_feedback(project_id: int, file_id: int, msg: FeedbackMessage):
    await FeedbackStore.save_message(project_id, file_id, msg)
    return {"status": "saved"}

@app.get("/projects/{project_id}/files/{file_id}/feedback")
async def get_feedback(project_id: int, file_id: int):
    messages = await FeedbackStore.get_messages(project_id, file_id)
    return messages




# ───────────── 플젝 페이지 라이브 채팅 저장 API ───────────── #
active_livechat_connections: dict[str, list[WebSocket]] = {}
all_alarm_connections = []

@app.websocket("/ws/livechat/notification")
async def websocket_all_alarm(websocket: WebSocket):
    await websocket.accept()
    all_alarm_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        all_alarm_connections.remove(websocket)

# 프로젝트별 라이브채팅
@app.websocket("/ws/livechat/{project_id}")
async def websocket_livechat(websocket: WebSocket, project_id: str):
    await websocket.accept()

    if project_id not in active_livechat_connections:
        active_livechat_connections[project_id] = []
    active_livechat_connections[project_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            parsed = json.loads(data)

            now = datetime.now(ZoneInfo("Asia/Seoul")).isoformat()
            outline = await ProjectOutline.objects.get_or_none(id=project_id)
            project_name = outline.name if outline else "프로젝트"

            # 프로젝트 정보 가져오기
            project_info = await ProjectInfo.objects.select_related("project").get_or_none(project=project_id)
            project_members = []
            if project_info:
                project_members = (project_info.proposer or []) + (project_info.worker or [])

            message = {
                "type": "chat",
                "sender_id": parsed["sender_id"],
                "sender_name": parsed["sender_name"],
                "text": parsed["text"],
                "time": now,
                "project_name": project_name,
                "project_id": project_id,
                "project_members": project_members  # 프로젝트 멤버 추가
            }

            json_msg = json.dumps(message)

            # Redis에 저장
            await r.rpush(f"livechat:{project_id}", json_msg)

            # 전체 알림에 전송 (프로젝트 멤버 정보 포함)
            for conn in all_alarm_connections:
                await conn.send_text(json_msg)

            # 현재 방 참여자에게도 전송
            for conn in active_livechat_connections[project_id]:
                await conn.send_text(json_msg)

    except WebSocketDisconnect:
        active_livechat_connections[project_id].remove(websocket)


@app.get("/livechat/{project_id}")
async def get_live_chat(project_id: str):
    raw = await r.lrange(f"livechat:{project_id}", 0, -1)
    return [json.loads(m) for m in raw]

########### 채팅 페이지 #############

# ---------- WebSocket 연결 관리 ---------- #
room_connections: dict[str, list[WebSocket]] = {}

@app.websocket("/ws/chat-room/{room_id}")
async def websocket_chat_room(websocket: WebSocket, room_id: str):
    await websocket.accept()

    if room_id not in room_connections:
        room_connections[room_id] = []
    room_connections[room_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            parsed = json.loads(data)

            time_now = datetime.now(ZoneInfo("Asia/Seoul")).isoformat()
            message = {
                "sender_id": parsed["sender_id"],
                "sender_name": parsed["sender_name"],
                "text": parsed["text"],
                "time": time_now
            }

            json_msg = json.dumps(message)

            await ChatRoomMessage.objects.create(
                room_id=room_id,
                sender_id=parsed["sender_id"],
                sender_name=parsed["sender_name"],
                text=parsed["text"],  # db.py의 필드명과 일치
            )
            await ChatStore.save_message(room_id, message)

            disconnected_connections = []
            for conn in room_connections.get(room_id, []):
                try:
                    await conn.send_text(json_msg)
                except WebSocketDisconnect:
                    disconnected_connections.append(conn)
                except Exception as e:
                    # 기타 연결 오류도 처리
                    disconnected_connections.append(conn)
            
            # 연결 해제된 WebSocket들을 목록에서 제거
            for conn in disconnected_connections:
                if conn in room_connections[room_id]:
                    room_connections[room_id].remove(conn)

    except WebSocketDisconnect:
        # 연결 해제 시 안전하게 제거
        if websocket in room_connections.get(room_id, []):
            room_connections[room_id].remove(websocket)
        # 빈 방의 연결 목록 정리
        if room_id in room_connections and len(room_connections[room_id]) == 0:
            del room_connections[room_id]
    except Exception as e:
        # 기타 예외 처리
        if websocket in room_connections.get(room_id, []):
            room_connections[room_id].remove(websocket)

# ---------- 채팅방 API 엔드포인트 ---------- #
@app.get("/chat-rooms/{room_id}/messages")
async def get_chat_room_messages(room_id: str, current_user = Depends(get_current_user)):
    try:
        # 채팅방 존재 및 권한 확인
        room = await ChatRoom.objects.get_or_none(id=str(room_id))
        if not room:
            raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다.")
        
        if current_user.id not in room.members:
            raise HTTPException(status_code=403, detail="채팅방 접근 권한이 없습니다.")
        
        messages = await ChatRoomMessage.objects.filter(
            room_id=room_id
        ).order_by("created_at").all()

        # 시스템 메시지 제거
        messages = [m for m in messages if m.sender_id != "system"]
        
        return [
            {
                "id": msg.id,
                "text": msg.text,
                "sender_id": msg.sender_id,
                "sender_name": msg.sender_name,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"메시지 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="메시지 조회에 실패했습니다.")
 #유저조회#   
@app.get("/users-forchatpage/{user_id}")
async def get_user_basic_info(user_id: str):
    user = await User.objects.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }

# ----- 채팅방 헤더 이미지 파일 ----- #
@app.post("/chat-rooms/{room_id}/image")
async def upload_chat_room_image(
    room_id: str = Path(..., description="채팅방 ID"),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    upload_dir = FilePath("static/chat_rooms")
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_ext = (file.filename or "png").split(".")[-1]
    file_name = f"{room_id}.{file_ext}"
    file_path = upload_dir / file_name

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    image_url = f"/static/chat_rooms/{file_name}"

    room = await ChatRoom.objects.get(id=room_id)
    room.image_url = image_url
    await room.update()

    return {"image_url": image_url}


# ---------- 채팅방 목록 조회 API  ---------- #
@app.get("/chat-rooms")
async def get_user_chat_rooms(current_user = Depends(get_current_user)):
    try:
        rooms = await ChatRoom.objects.all()
        # 현재 유저가 속한 방만 필터 (members가 None일 수도 있으니 방어적으로)
        rooms = [room for room in rooms if current_user.id in (room.members or [])]
        
        room_list = []
        for room in rooms:
            # 이 방의 모든 메시지 중 system 아닌 것만 가져와서 마지막 것 찾기
            msgs = await ChatRoomMessage.objects.filter(
                room_id=room.id
            ).order_by("-created_at").all()

            msgs = [m for m in msgs if m.sender_id != "system"]
            last_message = msgs[0] if msgs else None

            # 마지막 활동 시각: 메시지가 있으면 그 created_at, 없으면 방 생성 시각, 그것도 없으면 지금 시간
            last_dt = (
                (last_message.created_at if last_message else None)
                or getattr(room, "created_at", None)
                or datetime.now()
            )

            room_list.append({
                "id": room.id,
                "name": room.name,
                # image_url 필드가 없거나 None일 수도 있으니까 getattr 사용
                "image_url": getattr(room, "image_url", None),
                "lastMessage": (last_message.text if last_message else "메시지가 없습니다."),
                "time": last_dt.strftime("%m월 %d일"),
                "lastMessageTime": last_dt.isoformat(),
                "members": room.members or [],
            })

        # 마지막 활동 시간이 최신인 방이 맨 위로 오도록 정렬
        room_list.sort(key=lambda r: r["lastMessageTime"], reverse=True)

        return room_list
        
    except Exception as e:
        # 어떤 에러인지 디버깅용으로 타입까지 출력
        print("채팅방 목록 조회 오류 타입:", type(e))
        print("채팅방 목록 조회 오류 메시지:", repr(e))
        raise HTTPException(status_code=500, detail="채팅방 목록 조회에 실패했습니다.")

    

@app.get("/users/all")
async def get_all_users(current_user = Depends(get_current_user)):
    """모든 사용자 목록 조회 (현재 사용자 제외)"""
    try:
        users = await User.objects.all()
        return {
            "users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email
                }
                for user in users if user.id != current_user.id
            ]
        }
    except Exception as e:
        print(f"사용자 목록 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="사용자 목록 조회 실패")



# ---------- 채팅방 생성 API ---------- #
@app.post("/chat-rooms")
async def create_chat_room(room_data: ChatRoomCreateRequest, current_user = Depends(get_current_user)):
    try:
        member_ids = room_data.member_ids
        room_name = room_data.name or "새 채팅방"
        
        # 현재 사용자를 멤버에 추가 (중복 제거)
        if current_user.id not in member_ids:
            member_ids.append(current_user.id)
        member_ids = list(set(member_ids))

        new_room = await ChatRoom.objects.create(
            name=room_name,
            members=member_ids,
        )
        
        welcome_message = await ChatRoomMessage.objects.create(
            room_id=new_room.id,
            sender_id="system",
            sender_name="시스템",
            text=f"{current_user.name}님이 채팅방을 생성했습니다.",
        )
        
        return {
            "id": new_room.id,
            "name": new_room.name,
            "lastMessage": "새 채팅방이 생성되었습니다.",
            "time": "방금 전",
            "members": member_ids
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"채팅방 생성 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="채팅방 생성에 실패했습니다.")


# ---------- 채팅방 나가기 API 추가 ---------- #
@app.delete("/chat-rooms/{room_id}/leave")
async def leave_chat_room(room_id: str, current_user = Depends(get_current_user)):
    """채팅방 나가기"""
    try:
        room = await ChatRoom.objects.get_or_none(id=str(room_id))
        if not room:
            raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다.")
        
        if current_user.id not in room.members:
            raise HTTPException(status_code=400, detail="이미 채팅방에 참여하고 있지 않습니다.")
        
        # 멤버 목록에서 현재 사용자 제거
        updated_members = [member for member in room.members if member != current_user.id]
        
        if len(updated_members) == 0:
            # 마지막 멤버가 나가면 채팅방 삭제
            await room.delete()
            return {"message": "채팅방이 삭제되었습니다."}
        else:
            # 멤버 목록 업데이트
            await room.update(members=updated_members)
            
            # 나가기 메시지 추가
            await ChatRoomMessage.objects.create(
                room_id=room_id,
                sender_id="system",
                sender_name="시스템",
                text=f"{current_user.name}님이 채팅방을 나갔습니다.",
            )
            
            return {"message": "채팅방에서 나갔습니다."}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"채팅방 나가기 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="채팅방 나가기에 실패했습니다.")

#========================================================#
# ───────────── 진행도 업데이트 ───────────── #
@app.put("/todos/{todo_id}/progress")
async def update_todo_progress(todo_id: str, progress: int):
    await TodoProgressStore.set_progress(todo_id, progress)
    return {"message": "진행도 업데이트 완료", "progress": progress}

# ───────────── 진행도 조회 ───────────── #
@app.get("/todos/{todo_id}/progress")
async def get_todo_progress(todo_id: str):
    progress = await TodoProgressStore.get_progress(todo_id)
    return {"todo_id": todo_id, "progress": progress}








#=======================================================#
# ─────────────           투두 색            ───────────── #
#========================================================#

@app.get("/todos/{todo_id}/details")
async def get_todo_details(todo_id: str):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo를 찾을 수 없습니다")
    progress = await TodoProgressStore.get_progress(todo_id)
    participants = await TodoParticipantStore.get_participants(todo_id)
    background_color = await TodoStyleStore.get_background_color(todo_id)
    return {
        "id": todo.id,
        "text": todo.text,
        "deadline": todo.deadline,
        "start_day": todo.start_day,
        "progress": progress,
        "participants": participants,
        "background_color": background_color
    }


#업데이트
@app.put("/todos/{todo_id}")
async def update_todo(todo_id: str, update_data: dict):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo를 찾을 수 없습니다")
    if "text" in update_data:
        todo.text = update_data["text"]
    if "deadline" in update_data:
        todo.deadline = update_data["deadline"]
    if "start_day" in update_data:
        todo.start_day = update_data["start_day"]
    await todo.update()
    if "progress" in update_data:
        await TodoProgressStore.set_progress(todo_id, update_data["progress"])
    if "participants" in update_data:
        await TodoParticipantStore.set_participants(todo_id, update_data["participants"])
    if "background_color" in update_data:
        await TodoStyleStore.set_background_color(todo_id, update_data["background_color"])
    return {"message": "TODO 업데이트 완료"}

# 프로젝트 참여자 목록 조회 (참여자 선택용)
@app.get("/projects/{project_id}/members")
async def get_project_members(project_id: str):
    # 프로젝트 멤버 조회 로직 (기존 코드 활용)
    members_data = await r.smembers(f"project:{project_id}:members")
    members = []
    for member_id in members_data:
        member_info = await r.hgetall(f"user:{member_id}")
        if member_info:
            members.append({
                "id": member_id,
                "name": member_info.get("name", "Unknown"),
                "profile_image": member_info.get("profile_image", "/default_profile.png")
            })
    return members

#=======================================================#
# ─────────────          유저디테일         ───────────── #
#========================================================#

@app.get("/getUserProfiles", response_model=List[UserProfile])
async def get_UserProfile():
    serProfile = await UserProfile.objects.all()
    return serProfile

@app.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    user = await User.objects.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = await UserProfile.objects.get_or_none(user=user)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    s3_key = profile.profile_image

    # 안전 처리: 프로필 이미지가 없는 경우 None 반환
    if not s3_key:
        profile_dict = dict(profile)
        profile_dict.pop("profile_image", None)
        return {"profile": profile_dict, "profile_image_url": None}

    # presigned URL 생성
    presigned_url = generate_presigned_url(BUCKET_NAME, s3_key)
    if not presigned_url:
        raise HTTPException(status_code=500, detail="Presigned URL 생성 실패")

    profile_dict = dict(profile)
    profile_dict.pop("profile_image", None)
    return {"profile": profile_dict, "profile_image_url": presigned_url}


#배열로바꾸기
def arrayChange (value):
    if not value:
        return []
    try:
        data = json.loads(value)
        if isinstance(data, list):
            return data
        elif isinstance(data, str):
            return [data]
        else:
            return []
    except Exception:
        # 쉼표 기준 분할
        return [v.strip() for v in value.split(",") if v.strip()]

@app.put("/users/{user_id}/profile")
async def update_user_profile(
    user_id: str,
    profile_image: UploadFile = File(None),  # 파일 optional
    tech_stack: str = Form(""),  # 빈 문자열로 기본값 설정
    tags: str = Form(""),
    education: str = Form(""),
    intro: str = Form(""),
    career_summary: str = Form(""),
    phone: str = Form(""),
    location: str = Form(""),
    birth: str = Form(""),
    portfolio_url: str = Form(""),
    is_public: bool = Form(True),
    roles: str = Form(""),
    pinned_projects: str = Form("")
):
    user = await User.objects.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="유저 없음")

    profile = await UserProfile.objects.get_or_none(user=user)
    if not profile:
        raise HTTPException(status_code=404, detail="프로필 없음")

    # 1. S3 이미지 업로드 (파일이 있을 때만)
    if profile_image and profile_image.filename:
        ext = profile_image.filename.split('.')[-1]
        s3_key = f"profile_images/{uuid.uuid4()}.{ext}"
        file_content = await profile_image.read()
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=profile_image.content_type,
        )
        profile.profile_image = s3_key
 
    # 2. JSON값 갱신
    if tech_stack and tech_stack != "":
        profile.tech_stack = arrayChange(tech_stack)
    elif tech_stack == "":
        profile.tech_stack = []  # 빈 배열로 설정
        
    if tags and tags != "":
        profile.tags = arrayChange(tags)
    elif tags == "":
        profile.tags = []  # 빈 배열로 설정

    # 기본값들 설정
    profile.education = education if education else "저장된 학력이 없습니다."
    profile.intro = intro if intro else "저장된 소개글이 없습니다."
    profile.career_summary = career_summary if career_summary else ""
    profile.phone = phone if phone else "저장된 연락처가 없습니다."
    profile.location = location if location else "저장된 거주지역이 없습니다."
    profile.birth = birth if birth else "저장된 생년월일이 없습니다."
    profile.portfolio_url = portfolio_url if portfolio_url else ""
    profile.is_public = is_public
    profile.roles = roles if roles else "저장된 직업이 없습니다."
        
    await profile.update()
    
    response_data = {"detail": "프로필 업데이트 완료"}
    if profile.profile_image:
        current_presigned_url = generate_presigned_url(BUCKET_NAME, profile.profile_image)
        response_data["profile_image_url"] = current_presigned_url
    
    return response_data

#========================================================#
# ─────────────            캘린더           ───────────── #
#========================================================#

async def get_user_participated_projects(user_id: str):
    """사용자가 참여한 프로젝트 목록 조회"""
    try:
        projects = await ProjectInfo.objects.select_related("project").all()
        
        user_projects = []
        for project in projects:
            proposer_list = project.proposer or []
            worker_list = project.worker or []
            
            if user_id in proposer_list or user_id in worker_list:
                user_projects.append(project)
        
        return user_projects
        
    except Exception as e:
        print(f"데이터베이스 조회 오류: {str(e)}")
        return []

@app.get("/my-projects/participants")
async def get_my_projects_participants(current_user = Depends(get_current_user)):
    try:
        user_id = current_user.id
        projects = await get_user_participated_projects(user_id)
        
        user_projects = []
        for project in projects:
            my_role = "proposer" if user_id in (project.proposer or []) else "worker"
            participant_count = len(set((project.proposer or []) + (project.worker or [])))
            
            user_projects.append({
                "project_id": str(project.id),
                "project_name": project.project.name,
                "my_role": my_role,
                "participant_count": participant_count
            })
        
        return user_projects
        
    except Exception as e:
        print(f"프로젝트 조회 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="프로젝트 목록 조회 실패")

# 캘린더 라우터 - 하나로 통합
calendar_router = APIRouter(tags=["calendar"])

@calendar_router.post("/")
async def create_calendar_event(data: CalendarCreate):
    """캘린더 이벤트 생성"""
    key = f"calendar:{data.user_id}"
    now = datetime.now().isoformat()

    event_data = data.dict()
    event_data["created_at"] = now

    # datetime -> string 변환
    event_data["start"] = event_data["start"].isoformat()
    event_data["end"] = event_data["end"].isoformat()

    await r.rpush(key, json.dumps(event_data))
    return {"message": "이벤트 저장 완료", "created_at": now}

@calendar_router.get("/{user_id}")
async def get_calendar_events(
    user_id: str,
    project_id: Optional[str] = Query(None, description="특정 프로젝트 필터링")
):
    """캘린더 이벤트 조회"""
    key = f"calendar:{user_id}"
    raw_events = await r.lrange(key, 0, -1)
    events = [json.loads(e) for e in raw_events]
    
    # 프로젝트 필터링
    if project_id and project_id != 'all':
        events = [event for event in events if event.get('in_project') == project_id]
    
    return events

@calendar_router.put("/")
async def update_calendar_event(data: dict = Body(...)):
    """캘린더 이벤트 수정"""
    user_id = data.get("user_id")
    original_created_at = data.get("original_created_at")
    
    if not user_id or not original_created_at:
        raise HTTPException(status_code=400, detail="user_id와 original_created_at이 필요합니다")
    
    key = f"calendar:{user_id}"
    raw_events = await r.lrange(key, 0, -1)
    
    # 기존 이벤트 찾기 및 삭제
    event_found = False
    for idx, raw in enumerate(raw_events):
        event = json.loads(raw)
        if event.get("created_at") == original_created_at:
            await r.lrem(key, 1, raw)
            event_found = True
            break
    
    if not event_found:
        raise HTTPException(status_code=404, detail="수정할 이벤트를 찾을 수 없습니다")
    
    # 새 이벤트 데이터 생성
    new_event = {
        "text": data.get("text"),
        "start": data.get("start"),
        "end": data.get("end"),
        "color": data.get("color", "#3174ad"),
        "in_project": data.get("in_project"),
        "user_id": user_id,
        "is_repeat": False,
        "created_at": datetime.now().isoformat()
    }
    
    # 새 이벤트 저장
    await r.rpush(key, json.dumps(new_event))
    
    return {"message": "이벤트 수정 완료", "new_created_at": new_event["created_at"]}

@calendar_router.delete("/")
async def delete_calendar_event(data: CalendarDelete = Body(...)):
    """캘린더 이벤트 삭제"""
    key = f"calendar:{data.user_id}"
    raw_events = await r.lrange(key, 0, -1)

    for idx, raw in enumerate(raw_events):
        event = json.loads(raw)
        # created_at 비교 시 ISO 형식으로 통일
        event_created_at = event.get("created_at")
        input_created_at = data.created_at.isoformat() if hasattr(data.created_at, 'isoformat') else str(data.created_at)
        
        if event_created_at == input_created_at:
            await r.lrem(key, 1, raw)
            return {"message": "이벤트 삭제 완료"}

    return {"message": "삭제할 이벤트를 찾을 수 없습니다.", "debug_info": f"Looking for: {input_created_at}"}

# 라우터 등록 - prefix는 한 곳에서만
app.include_router(calendar_router, prefix="/calendar")

######## 파일 업로드 추적 위한 api (알림팝업에 씀)#######
@app.websocket("/ws/fileupload")
async def websocket_file_upload(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        msg = json.loads(data)

        # 여기에 반드시 포함
        msg_to_send = {
            "type": "upload",
            "time": datetime.now(ZoneInfo("Asia/Seoul")).isoformat(),
            "file_name": msg.get("file_name", "파일명없음"),
            "project_name": msg.get("project_name", "프로젝트없음"),
            "uploader": msg.get("uploader", "업로더없음")
        }

        for conn in all_alarm_connections:
            await conn.send_text(json.dumps(msg_to_send))
    except:
        pass
    finally:
        await websocket.close()




# ───────────── 잇다프로젝트프로필연결 api ───────────── #

@app.get("/users/{user_id}/available-projects")
async def get_available_projects(user_id: str):
    """사용자가 참여 가능한 프로젝트 목록 (worker 배열에 포함된 프로젝트)"""
    try:
        # 사용자 프로필 조회
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        if not user_profile:
            return {
                "user_id": user_id,
                "available_projects": [],
                "total_count": 0,
                "message": "사용자 프로필을 찾을 수 없습니다"
            }
        
        # worker 배열에 user_id가 포함된 프로젝트들 조회
        available_projects = await ProjectInfo.objects.filter(
            worker__contains=[user_id]  # JSON 배열에서 user_id 포함 검색
        ).all()
        
        # 이미 참여 중인 프로젝트 ID 목록
        existing_participations = await ProjectParticipation.objects.filter(
            user_profile=user_profile
        ).all()
        existing_project_ids = [p.project.id for p in existing_participations]
        
        # 참여 가능한 프로젝트 데이터 구성 (아직 참여하지 않은 것만)
        projects_data = []
        for project_info in available_projects:
            # 이미 참여 중인 프로젝트는 제외
            if project_info.id in existing_project_ids:
                continue
                
            project_data = {
                "project_info_id": project_info.id,
                "project_name": f"프로젝트 {project_info.id}",
                "project_description": project_info.explain,
                "thumbnail": project_info.thumbnail,
                "salary_type": project_info.salary_type,
                "education": project_info.education,
                "recruit_number": project_info.recruit_number,
                "career": project_info.career,
                "contract_until": project_info.contract_until.strftime("%Y.%m.%d"),
                "sign_deadline": project_info.sign_deadline.strftime("%Y.%m.%d"),
                "current_workers": len(project_info.worker) if project_info.worker else 0
            }
            projects_data.append(project_data)
        
        return {
            "user_id": user_id,
            "available_projects": projects_data,
            "total_count": len(projects_data)
        }
        
    except Exception as e:
        return {
            "user_id": user_id,
            "available_projects": [],
            "total_count": 0,
            "error": str(e)
        }
@app.post("/users/{user_id}/join-project/{project_id}")
async def join_project(user_id: str, project_id: int):
    """ProjectParticipation에 추가"""
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        project_info = await ProjectInfo.objects.get_or_none(id=project_id)
        
        if not user_profile or not project_info:
            raise HTTPException(status_code=404, detail="사용자 또는 프로젝트를 찾을 수 없습니다")
        
        # 이미 참여 중인지 확인
        existing = await ProjectParticipation.objects.get_or_none(
            user_profile=user_profile, project=project_info
        )
        if existing:
            return {"message": "이미 참여 중인 프로젝트입니다"}
        
        # 참여 추가
        participation = await ProjectParticipation.objects.create(
            user_profile=user_profile,
            project=project_info,
            joined_at=date.today(),
            left_at=project_info.contract_until
        )
        
        return {
            "message": "프로젝트에 참여했습니다",
            "participation_id": participation.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# 프로젝트 참여 삭제
@app.delete("/users/{user_id}/leave-project/{project_id}")
async def leave_project(user_id: str, project_id: int):
    """ProjectParticipation에서 삭제"""
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        
        participation = await ProjectParticipation.objects.get_or_none(
            user_profile=user_profile,
            project__id=project_id
        )
        
        if not participation:
            return {"message": "참여하지 않은 프로젝트입니다"}
        
        await participation.delete()
        
        return {"message": "프로젝트 참여를 취소했습니다"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/itdaProjectswithParticipate")
async def get_all_itdaProjectswithParticipate():
    ProjectParticipations = await ProjectParticipation.objects.all()
    return ProjectParticipations
@app.get("/users/{user_id}/projects")
async def get_user_projects(user_id: str):
    """사용자가 참여 중인 ITDA 플랫폼 프로젝트 목록 조회 - 객체 배열만 반환"""
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        if not user_profile:
            return []  # 빈 배열 반환
        
        participations = await ProjectParticipation.objects.select_related([
            "project",
            "project__project"
        ]).filter(user_profile=user_profile).all()
        
        return [participation.dict() for participation in participations]
        
    except Exception as e:
        return []  
@app.get("/users/{user_id}/worker-projects")
async def get_worker_projects(user_id: str):
    """사용자가 worker로 포함된 모든 프로젝트 목록"""
    user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
    if not user_profile:
        return {"user_id": user_id, "worker_projects": [], "participated_projects": []}
    
    # 모든 프로젝트
    all_projects = await ProjectInfo.objects.select_related("project").all()
    
    # all Project에서 worker == user_id인지 필터링
    worker_projects = []
    for project in all_projects:
        if project.worker and user_id in project.worker:
            worker_projects.append(project)

    # 현재 참여 중인 프로젝트 ID 목록
    participated = await ProjectParticipation.objects.filter(
        user_profile=user_profile
    ).all()
    participated_ids = [p.project.id for p in participated]
        
    projects_data = []
    for pO in worker_projects:
        project_data = {
            "project_info_id": pO.id,
            "project_name": pO.project.name if pO.project else f"프로젝트 {pO.id}",
            "project_description": pO.explain,
            "thumbnail": pO.thumbnail,
            "classification": pO.project.classification if pO.project else "",
            "recruit_number": pO.recruit_number,
            "salary_type": pO.salary_type,
            "education": pO.education,
            "worker_list": pO.worker,  
            "is_participated": pO.id in participated_ids,
            "classification":pO.project.classification,
            "contract_until":pO.contract_until.strftime("%Y.%m.%d"),
            
        }
        projects_data.append(project_data)
    
    return {
        "user_id": user_id,
        "worker_projects": projects_data,
        "participated_project_ids": participated_ids,
        "debug_info": {
            "total_projects": len(all_projects),
            "worker_projects_count": len(worker_projects),
            "participated_count": len(participated_ids)
        }
    }




# ───────────── 개인프로젝트프로필연결 api ───────────── #


def is_image_file(filename: str) -> bool:
    if not filename:
        return False
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
    extension = '.' + filename.split('.')[-1].lower()
    return extension in image_extensions
#s3권한겟
def generate_presigned_url_for_preview(bucket_name: str, object_key: str, expiration: int = 300):
    """미리보기용 presigned URL 생성"""
    response = s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket_name,
            'Key': object_key
        },
        ExpiresIn=expiration
    )
    return response


# 조회
@app.get("/users/{user_id}/personal-works")
async def get_personal_works(user_id: str):
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        if not user_profile:
            return []
        
        works = await ParticipationHistory.objects.filter(user_profile=user_profile).all()
        
        result = []
        for work in works:
            print(f"[DEBUG] work_id={work.id}, attachment_url={work.attachment_url}")

            work_dict = work.dict()
            
            # 파일 정보 처리
            if work.attachment_url:
                if '|' in work.attachment_url:
                    filename, s3_key = work.attachment_url.split('|', 1)
                    has_s3_file = True
                else:
                    filename = work.attachment_url
                    has_s3_file = False
                
                work_dict['file_info'] = {
                    'filename': filename,
                    'is_image': is_image_file(filename),
                    'has_file': True,
                    'has_s3_file': has_s3_file  # 실제 다운로드 가능 여부
                }
            else:
                work_dict['file_info'] = {'has_file': False, 'has_s3_file': False}
            
            result.append(work_dict)
        
        return result
    except Exception as e:
        print(f"조회 오류: {e}")
        return []
# 생성
@app.post("/users/{user_id}/personal-works")
async def create_personal_work(
    user_id: str,
    company: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    start_date: str = Form(...),
    end_date: str = Form(None),
    file: UploadFile = File(None)
):
    user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
    if not user_profile:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # S3에 실제 파일 업로드 + 파일명 저장
    attachment_url = None
    if file and file.filename:
        try:
            file_content = await file.read()
            extension = file.filename.split('.')[-1]
            s3_key = f"personal-works/{uuid.uuid4()}.{extension}"

            # S3에 파일 업로드
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=file_content,
                ContentType=file.content_type
            )

            # 파일명과 S3 키를 함께 저장 (구분자 사용)
            attachment_url = f"{file.filename}|{s3_key}"
        except Exception as e:
            print(f"S3 업로드 오류: {e}")
            # S3 업로드 실패 시 파일명만 저장
            attachment_url = file.filename
    
    # 날짜 변환
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
    
    new_work = await ParticipationHistory.objects.create(
        user_profile=user_profile,
        company=company,
        title=title,
        description=description,
        start_date=start_date_obj,
        end_date=end_date_obj,
        attachment_url=attachment_url
    )
    
    return new_work.dict()
# 수정
@app.put("/users/{user_id}/personal-works/{work_id}")
async def update_personal_work(
    user_id: str,
    work_id: int,
    company: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    start_date: str = Form(...),
    end_date: str = Form(None),
    file: UploadFile = File(None),
    keep_existing_file: bool = Form(True)
):
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        work = await ParticipationHistory.objects.get_or_none(
            id=work_id, user_profile=user_profile
        )
        
        if not work:
            raise HTTPException(status_code=404, detail="작업물을 찾을 수 없습니다")
        
        # 파일 처리 로직 수정
        if file and file.filename:
            # 기존 파일이 있다면 S3에서 삭제
            if work.attachment_url and '|' in work.attachment_url:
                try:
                    old_filename, old_s3_key = work.attachment_url.split('|', 1)
                    s3.delete_object(Bucket=BUCKET_NAME, Key=old_s3_key)
                    print(f"기존 파일 삭제: {old_s3_key}")
                except Exception as e:
                    print(f"기존 파일 삭제 실패: {e}")
            
            # 새 파일 업로드
            try:
                file_content = await file.read()
                extension = file.filename.split('.')[-1]
                s3_key = f"personal-works/{uuid.uuid4()}.{extension}"

                s3.put_object(
                    Bucket=BUCKET_NAME,
                    Key=s3_key,
                    Body=file_content,
                    ContentType=file.content_type
                )

                # 새 파일 정보 저장 (filename|s3_key 형식)
                work.attachment_url = f"{file.filename}|{s3_key}"
                print(f"새 파일 업로드 완료: {work.attachment_url}")
                
            except Exception as e:
                print(f"새 파일 업로드 실패: {e}")
                # 업로드 실패 시 파일명만 저장
                work.attachment_url = file.filename
                
        elif not keep_existing_file:
            # 파일 삭제 요청
            if work.attachment_url and '|' in work.attachment_url:
                try:
                    old_filename, old_s3_key = work.attachment_url.split('|', 1)
                    s3.delete_object(Bucket=BUCKET_NAME, Key=old_s3_key)
                    print(f"파일 삭제: {old_s3_key}")
                except Exception as e:
                    print(f"파일 삭제 실패: {e}")
            work.attachment_url = None
        
        # 기본 정보 업데이트
        work.company = company
        work.title = title
        work.description = description
        work.start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        work.end_date = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
        
        await work.update()
        
        # 응답 전에 로그 출력
        print(f"수정 완료 - attachment_url: {work.attachment_url}")
        
        return work.dict()
        
    except Exception as e:
        print(f"수정 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"작업물 수정 실패: {str(e)}")
# 삭제
@app.delete("/users/{user_id}/personal-works/{work_id}")
async def delete_personal_work(user_id: str, work_id: int):
    user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
    work = await ParticipationHistory.objects.get_or_none(id=work_id, user_profile=user_profile)
    
    if not work:
        raise HTTPException(status_code=404, detail="작업물을 찾을 수 없습니다")
    
    await work.delete()
    return {"message": "삭제 완료"}
# 개인 첨부파일 다운로드
@app.get("/users/{user_id}/personal-works/{work_id}/download")
async def download_personal_work_file(user_id: str, work_id: int):
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        work = await ParticipationHistory.objects.get_or_none(
            id=work_id, user_profile=user_profile
        )
        
        if not work or not work.attachment_url:
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
        
        # 파일명과 S3 키 분리
        if '|' not in work.attachment_url:
            raise HTTPException(status_code=404, detail="다운로드할 파일이 없습니다")
        
        filename, s3_key = work.attachment_url.split('|', 1)
        
        # S3에서 파일 다운로드 (모든 파일 타입 지원)
        try:
            response = s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
            file_content = response['Body'].read()
            
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type='application/octet-stream',
                headers={
                    "Content-Disposition": f"attachment; filename*=UTF-8''{urllib.parse.quote(filename)}"
                }
            )
            
        except Exception as s3_error:
            print(f"S3 다운로드 오류: {s3_error}")
            raise HTTPException(status_code=500, detail="파일 다운로드 실패")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"다운로드 실패: {str(e)}")
   #개인첨부파일 미리보기
@app.get("/users/{user_id}/personal-works/{work_id}/file/preview")
async def preview_personal_work_file(user_id: str, work_id: int):
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        work = await ParticipationHistory.objects.get_or_none(
            id=work_id, user_profile=user_profile
        )
        
        if not work or not work.attachment_url:
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
        
        # 파일명과 S3 키 분리
        if '|' in work.attachment_url:
            filename, s3_key = work.attachment_url.split('|', 1)
        else:
            raise HTTPException(status_code=404, detail="미리보기할 파일이 없습니다")
        
        # 이미지 파일인지 확인
        if not is_image_file(filename):
            raise HTTPException(status_code=400, detail="이미지 파일만 미리보기 가능합니다")
        
        # 미리보기용 presigned URL 생성 (5분)
        preview_url = generate_presigned_url_for_preview(BUCKET_NAME, s3_key, 300)
        
        if not preview_url:
            raise HTTPException(status_code=500, detail="미리보기 URL 생성 실패")
        
        return {"preview_url": preview_url, "filename": filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"미리보기 실패: {str(e)}")




# ───────────── 태그수정 ───────────── #
@app.put("/users/{user_id}/profile/tags")
async def update_user_tags(user_id: str, tag_data: dict):
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        if not user_profile:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        new_tags = tag_data.get('tags', [])
        user_profile.tags = new_tags
        await user_profile.update()
        
        return {"message": "태그가 업데이트되었습니다", "tags": new_tags}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"태그 업데이트 실패: {str(e)}")
@app.put("/users/{username}/tech-stack")
async def update_tech_stack(username: str, tech_stack_data: dict):
    """기술스택 업데이트"""
    try:
        print(f"받은 데이터: {tech_stack_data}")  # 디버깅용
        print(f"사용자명: {username}")  # 디버깅용
        
        # UserProfile 조회 (Tortoise ORM 방식)
        user_profile = await UserProfile.objects.get_or_none(user__id=username)
        
        if not user_profile:
            raise HTTPException(status_code=404, detail="사용자 프로필을 찾을 수 없습니다")
        
        # tech_stack 업데이트
        user_profile.tech_stack = tech_stack_data['tech_stack']
        
        # 데이터베이스에 저장 (Tortoise ORM 방식)
        await user_profile.update()
        
        print(f"업데이트 완료 - tech_stack: {user_profile.tech_stack}")  # 디버깅용
        
        return {
            "message": "기술스택이 업데이트되었습니다", 
            "tech_stack": user_profile.tech_stack
        }
    
    except Exception as e:
        print(f"기술스택 업데이트 에러: {str(e)}")  # 디버깅용
        raise HTTPException(status_code=500, detail=f"기술스택 업데이트 실패: {str(e)}")


# ───────────── 유저 정보 수정 ───────────── #
@app.put("/users/{user_id}/profile/edit")
async def edit_user_profile(
    user_id: str,
    profile_image: UploadFile = File(None),
    name: str = Form(None),
    roles: str = Form(None),
    education: str = Form(None),
    intro: str = Form(None),
    phone: str = Form(None),
    location: str = Form(None),
    birth: str = Form(None),
    portfolio_url: str = Form(None)
):
    """프로필 통합 수정 API"""
    try:
        # 사용자 및 프로필 조회
        user = await User.objects.get_or_none(id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

        profile = await UserProfile.objects.get_or_none(user=user)
        if not profile:
            raise HTTPException(status_code=404, detail="프로필을 찾을 수 없습니다")

        # ⭐ User 모델의 name 업데이트 (닉네임 변경)
        if name and name.strip() and name.strip() != user.name:
            print(f"닉네임 변경: {user.name} -> {name.strip()}")
            user.name = name.strip()
            await user.update()

        # 프로필 이미지 업데이트
        if profile_image and profile_image.filename:
            # 기존 이미지 삭제
            if profile.profile_image:
                try:
                    s3.delete_object(Bucket=BUCKET_NAME, Key=profile.profile_image)
                    print(f"기존 이미지 삭제: {profile.profile_image}")
                except Exception as e:
                    print(f"기존 이미지 삭제 실패: {e}")

            # 새 이미지 업로드
            ext = profile_image.filename.split('.')[-1]
            s3_key = f"profile_images/{uuid.uuid4()}.{ext}"
            file_content = await profile_image.read()
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=file_content,
                ContentType=profile_image.content_type,
            )
            profile.profile_image = s3_key
            print(f"새 이미지 업로드: {s3_key}")

        # 프로필 필드 업데이트 (값이 있고 기존 값과 다를 때만)
        if roles and roles.strip() and roles.strip() != profile.roles:
            profile.roles = roles.strip()
        if education and education.strip() and education.strip() != profile.education:
            profile.education = education.strip()
        if intro and intro.strip() and intro.strip() != profile.intro:
            profile.intro = intro.strip()
        if phone and phone.strip() and phone.strip() != profile.phone:
            profile.phone = phone.strip()
        if location and location.strip() and location.strip() != profile.location:
            profile.location = location.strip()
        if birth and birth.strip() and birth.strip() != profile.birth:
            profile.birth = birth.strip()
        if portfolio_url and portfolio_url.strip() and portfolio_url.strip() != profile.portfolio_url:
            profile.portfolio_url = portfolio_url.strip()

        await profile.update()

        # 업데이트된 사용자 정보 다시 조회 (name 변경 반영)
        updated_user = await User.objects.get(id=user_id)

        # 응답 데이터 구성
        response_data = {
            "detail": "프로필이 성공적으로 업데이트되었습니다",
            "user": {
                "id": updated_user.id,
                "name": updated_user.name,  # 업데이트된 닉네임
                "email": updated_user.email
            },
            "profile": {
                "roles": profile.roles,
                "education": profile.education,
                "intro": profile.intro,
                "phone": profile.phone,
                "location": profile.location,
                "birth": profile.birth,
                "portfolio_url": profile.portfolio_url
            }
        }

        # 프로필 이미지 URL 추가
        if profile.profile_image:
            response_data["profile_image_url"] = generate_presigned_url(BUCKET_NAME, profile.profile_image)

        return response_data

    except Exception as e:
        print(f"프로필 수정 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"프로필 수정 실패: {str(e)}")


# ───────────── 플젝고정 ───────────── #
@app.post("/users/{user_id}/pin-project/{project_id}")
async def toggle_pin_project(user_id: str, project_id: str):
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        if not user_profile:
            raise HTTPException(status_code=404, detail="사용자 프로필을 찾을 수 없습니다")
        
        pinned_projects = user_profile.pinned_projects or []
        
        if project_id in pinned_projects:
            # 언핀
            pinned_projects.remove(project_id)
            is_pinned = False
        else:
            # 핀 (최대 5개까지만 허용)
            if len(pinned_projects) >= 5:
                raise HTTPException(status_code=400, detail="최대 5개까지만 핀할 수 있습니다")
            pinned_projects.append(project_id)
            is_pinned = True
        
        user_profile.pinned_projects = pinned_projects
        await user_profile.update()
        
        return {
            "message": "핀 상태가 업데이트되었습니다",
            "is_pinned": is_pinned,
            "pinned_projects": pinned_projects
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"핀 업데이트 실패: {str(e)}")

# 사용자의 핀된 프로젝트 목록 조회
@app.get("/users/{user_id}/pinned-projects")
async def get_pinned_projects(user_id: str):
    try:
        user_profile = await UserProfile.objects.get_or_none(user__id=user_id)
        if not user_profile:
            return {"pinned_projects": []}
        
        return {"pinned_projects": user_profile.pinned_projects or []}
        
    except Exception as e:
        return {"pinned_projects": []}