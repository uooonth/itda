
from fastapi import FastAPI,status,Depends, APIRouter,Body,Request
from backend.schemas import ScheduleUpdate,UserProfileCreate,UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, ProjectOut
from backend.db import database, UserProfile,User,ProjectInfo, ProjectOutline, UploadedFile, Calendar, Chat, Todo,ProjectFolder, UserProfile,ApplyForm

from backend.db import Calendar as CalendarModel
from uuid import uuid4
from contextlib import asynccontextmanager
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, CalendarCreate, ChatMessage, FeedbackChatMessage,UploadedFileCreate,TodoResponse,TodoCreate,CalendarDelete
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
from backend.redisClass import Notice,r,FeedbackStore,FeedbackMessage,TodoProgressStore,TodoStyleStore,TodoParticipantStore

import redis
import json
from fastapi import File, UploadFile, Form, Depends, FastAPI, WebSocket, WebSocketDisconnect
from datetime import date
from fastapi.staticfiles import StaticFiles
import shutil
from zoneinfo import ZoneInfo



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

    hashed_password = get_password_hash(user.password)

    existing_user = await User.objects.get_or_none(email=user.email)

    # #####################################################
    # 배포시에 빼기 #######################################3
    #################################################
    email_to_store = user.email if not existing_user else "placeholder@example.com"

    # 1. User 생성
    new_user = await User.objects.create(
        id=user.id,
        name=user.name,
        pw_hash=hashed_password,
        email=email_to_store
    )

    # 2. UserProfile 기본값 생성
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
        is_public=True
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

    if not verify_password(user_credentials.password, user.pw_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="실수 pw"
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
        print("📂 썸네일:", thumbnail.filename)
        print("📏 파일 크기:", len(content))
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

@app.delete("/projects/{project_id}")
async def delete_project(project_id: int, current_user: User = Depends(get_current_user)):
    project = await ProjectInfo.objects.get_or_none(id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    
    if current_user.id != project.proposer[0]:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    await ApplyForm.objects.filter(project=project).delete()
    
    # 프로젝트 삭제
    await project.delete()
    
    return {"detail": "삭제 성공"}


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

# 수락
@router.post("/projects/{project_id}/accept")
async def accept_applicant(project_id: int, user_id: str):
    project = await ProjectInfo.objects.get(id=project_id)
    user = await User.objects.get(id=user_id)
    user_profile = await UserProfile.objects.get(user=user)

    # 참여기록 추가
    await ProjectParticipation.objects.create(
        user_profile=user_profile,
        project=project,
        joined_at=date.today()
    )

    # ApplyForm 삭제
    await ApplyForm.objects.filter(user=user, project=project).delete()
    
    if user_id not in project.worker:
        project.worker.append(user_id)
        await project.update()

    return {"status": "accepted"}

# 거절
@router.post("/projects/{project_id}/reject")
async def reject_applicant(project_id: int, user_id: str):
    project = await ProjectInfo.objects.get(id=project_id)
    user = await User.objects.get(id=user_id)

    await ApplyForm.objects.filter(user=user, project=project).delete()

    return {"status": "rejected"}

@router.get("/{project_id}/applicants")
async def get_applicants(project_id: int):
    apply_forms = await ApplyForm.objects.select_related("user").filter(project__id=project_id).all()

    result = []
    for form in apply_forms:
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
    return {"message": f"{project_id}에 공지사항이 설정되었습니다."}


# 공지사항 가져오기 API
@app.get("/project/{project_id}/notice")
async def get_notice(project_id: str):
    redis_key = f"project:공지:{project_id}"
    notice = await r.get(redis_key)  # ✅ await 추가
    if notice:
        return {"project_id": project_id, "content": notice}  
    else:
        raise HTTPException(status_code=404, detail="공지사항이 없습니다.")
    
    
# ───────────── 플젝-투두-postgreSQL,redis ───────────── #


# 투두 생성 API
@app.post("/todos", response_model=Todo)
async def create_todo(todo: TodoCreate):
    todo_id = str(uuid.uuid4())

    # 상태 유효성 검사
    if todo.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    # DB에 저장
    new_todo = await Todo.objects.create(
        id=todo_id,
        text=todo.text,
        user={"id": todo.user_id},
        deadline=todo.deadline,
        start_day=todo.start_day
    )

    # Redis 저장
    await r.sadd(f"project:{todo.project_id}:todos", todo_id)
    await r.set(f"todo_status:{todo_id}", todo.status)
    
    # Redis에 진행도 저장 (새로 추가)
    await TodoProgressStore.set_progress(todo_id, 0)
    
    return new_todo


@app.get("/todos")
async def get_all_todos():
    todos = await Todo.objects.all()
    return todos
@app.get("/projects/{project_id}/todos/status/{status}")
async def filltering_status_todo(project_id: str, status: str):
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = []
    keys = await r.keys("project:*:todos")  # ✅ await 추가
    for key in keys:
        if key == f"project:{project_id}:todos":
            todo_ids = await r.smembers(key)  # 여기도 await 필요
            for todo_id in todo_ids:
                status_value = await r.get(f"todo_status:{todo_id}")
                if status_value:
                    status_str = status_value.decode("utf-8") if isinstance(status_value, bytes) else status_value
                    if status_str == status:
                        result.append(todo_id.decode("utf-8") if isinstance(todo_id, bytes) else todo_id)

    return {"status": status, "todos": result}

# 투두 프로젝트 별 가져오기 api
@app.get("/projects/{project_id}/todos", response_model=List[TodoResponse])
async def get_todos_by_project(project_id: str):
    print("요청된 project_id:", project_id)
    keys = await r.keys("*")
    print("현재 Redis에 저장된 키 목록:", keys)

    todo_ids = await r.smembers(f"project:{project_id}:todos")
    print("조회된 투두 ID 목록:", todo_ids)

    result = []
    for todo_id in todo_ids:
        todo = await Todo.objects.get_or_none(id=todo_id)
        if todo:
            status = await r.get(f"todo_status:{todo_id}") or "in_progress"
            result.append(TodoResponse(
                id=todo.id,
                text=todo.text,
                user_id=todo.user.id,
                deadline=str(todo.deadline),
                start_day=str(todo.start_day),
                project_id=project_id,
                status=status
            ))
    return result


# 투두 삭제 API
@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, project_id: str):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    await todo.delete()

    await r.delete(f"todo_status:{todo_id}")
    await r.srem(f"project:{project_id}:todos", todo_id)
    await TodoProgressStore.delete_progress(todo_id)


    return {"message": f"{todo_id} deleted successfully"}



# ───────────── 플젝-투두-상태변경crud───────────── #
VALID_STATUSES = ["in_progress", "completed", "waiting_feedback"]

# ───────────── Redis 헬퍼 함수 ───────────── #
async def get_project_id_of_todo(todo_id: str) -> Optional[str]:
    todo = await Todo.objects.select_related("user").get_or_none(id=todo_id)
    return getattr(todo, "project_id", None)


# ───────────── Todo 생성 ───────────── #
@app.post("/todos", response_model=TodoResponse)
async def create_todo(todo: TodoCreate):
    todo_id = str(uuid.uuid4())

    if todo.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    new_todo = await Todo.objects.create(
        id=todo_id,
        text=todo.text,
        user={"id": todo.user_id},
        deadline=todo.deadline,
        start_day=todo.start_day
    )

    await r.sadd(f"project:{todo.project_id}:todos", todo_id)
    await r.set(f"todo_status:{todo_id}", todo.status)

    return TodoResponse(
        id=new_todo.id,
        text=new_todo.text,
        user_id=todo.user_id,
        deadline=todo.deadline,
        start_day=todo.start_day,
        project_id=todo.project_id,
        status=todo.status
    )


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
        raise HTTPException(status_code=400, detail="statusㅁㅈ")

    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo 못ㅊ")

    await r.set(f"todo_status:{todo_id}", status)

    project_id = await get_project_id_of_todo(todo_id)
    if project_id:
        await r.sadd(f"project:{project_id}:todos", todo_id)

    return {"message": "ㅇㅇ"}


@app.get("/todos/{todo_id}/status")
async def get_todo_status(todo_id: str):
    status = await r.get(f"todo_status:{todo_id}")
    if not status:
        raise HTTPException(status_code=404, detail="스태터스못찾")
    return {"todo_id": todo_id, "status": status}


# ───────────── Todo 삭제 ───────────── #
@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, project_id: str):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="투두못찾")

    await todo.delete()
    await r.delete(f"todo_status:{todo_id}")
    await r.srem(f"project:{project_id}:todos", todo_id)

    return {todo_id,"삭제완료"}




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
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=file_content,
        ContentType=file.content_type
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
    try:
        print("🔍 S3 삭제 시도:", file.s3_key)
        s3.delete_object(Bucket=BUCKET_NAME, Key=file.s3_key)
    except ClientError as e:
        print("❌ S3 삭제 실패:", e)
        raise HTTPException(status_code=500, detail="zz500")

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


import boto3
from botocore.exceptions import ClientError


def generate_presigned_url(bucket_name, object_key, expiration=3600):
    s3_client = boto3.client('s3')
    try:
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket_name,
                                                            'Key': object_key},
                                                    ExpiresIn=expiration)
    except ClientError as e:
        print(e)
        return None
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




# ───────────── 플젝 페이지 실시간 채팅 저장 API ───────────── #
# 프로젝트 id 받아오는 데서 오류가 나는 듯
active_livechat_connections: dict[str, list[WebSocket]] = {}

@app.websocket("/ws/livechat/{project_id}")
async def websocket_livechat(websocket: WebSocket, project_id: str):
    await websocket.accept()

    # 연결 관리
    if project_id not in active_livechat_connections:
        active_livechat_connections[project_id] = []
    active_livechat_connections[project_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            parsed = json.loads(data)

            now = datetime.now(ZoneInfo("Asia/Seoul")).isoformat()
            message = {
                "sender_id": parsed["sender_id"],
                "sender_name": parsed["sender_name"],
                "text": parsed["text"],
                "time": now
            }

            json_msg = json.dumps(message)
            await r.rpush(f"livechat:{project_id}", json_msg)

            # 모든 연결된 유저에게 전송
            for conn in active_livechat_connections[project_id]:
                await conn.send_text(json_msg)
            

    except WebSocketDisconnect:
        active_livechat_connections[project_id].remove(websocket)
        

@app.get("/livechat/{project_id}")
async def get_live_chat(project_id: str):
    raw = await r.lrange(f"livechat:{project_id}", 0, -1)
    return [json.loads(m) for m in raw]


    
# ───────────── 피드백 팝업 페이지 채팅 저장 API ───────────── #
@app.post("/feedbackchat/send")
async def send_feedback_chat_message(msg: FeedbackChatMessage):
    redis_key = f"chat:feedback:{msg.feedback_id}"
    message_data = {
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "text": msg.text,
        "time": msg.time.isoformat()
    }
    r.rpush(redis_key, json.dumps(message_data))
    return {"message": "피드백 채팅 메시지 저장 완료"}

# 채팅 불러오기 API
@app.get("/feedbackchat/{feedback_id}")
async def get_feedback_chat_messages(feedback_id: str):
    redis_key = f"chat:feedback:{feedback_id}"
    messages = r.lrange(redis_key, 0, -1)
    return [json.loads(m) for m in messages]

# ───────────── 채팅 페이지 웹소켓켓 API ───────────── #
active_connections: dict[str, list[WebSocket]] = {}

@app.websocket("/ws/chat/{project_id}")
async def websocket_chat(websocket: WebSocket, project_id: str):
    await websocket.accept()

    if project_id not in active_connections:
        active_connections[project_id] = []
    active_connections[project_id].append(websocket)

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

            await r.rpush(f"chat:project:{project_id}", json_msg)

            # 현재 연결된 유저에게 브로드캐스트
            for conn in active_connections.get(project_id, []):
                await conn.send_text(json_msg)

    except WebSocketDisconnect:
        active_connections[project_id].remove(websocket)

# ───────────── 채팅 페이지 채팅 저장 API ───────────── #
@app.post("/chat/send")
async def send_chat_message(msg: ChatMessage):
    time_now = datetime.now(ZoneInfo("Asia/Seoul"))
    data = json.dumps({
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "text": msg.text,
        "time": time_now.isoformat()
    })
    await r.rpush(f"chat:project:{msg.project_id}", data)
    return {"message": "저장됨"}

@app.get("/chat/{project_id}")
async def get_chat(project_id: str):
    raw = await r.lrange(f"chat:project:{project_id}", 0, -1)
    return [json.loads(m) for m in raw]


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
    # DB에서 기본 정보 조회
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Redis에서 추가 정보 조회
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
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # DB 업데이트
    if "text" in update_data:
        todo.text = update_data["text"]
    if "deadline" in update_data:
        todo.deadline = update_data["deadline"]
    if "start_day" in update_data:
        todo.start_day = update_data["start_day"]
    
    await todo.update()
    
    # Redis 업데이트
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

    # profile_image가 S3 객체 키라고 가정 (예: "profile_images/...jpg")
    s3_key = profile.profile_image
    presigned_url = generate_presigned_url(BUCKET_NAME, s3_key)
    if not presigned_url:
        raise HTTPException(status_code=500, detail="Presigned URL 생성 실패")

    # 프로필 정보와 presigned URL만 반환
    profile_dict = dict(profile)
    profile_dict.pop("profile_image", None)  # 원본 presigned URL은 반환하지 않음
    return {"profile": profile_dict, "profile_image_url": presigned_url}





@app.put("/users/{user_id}/profile")
async def update_user_profile(
    user_id: str,
    profile_image: UploadFile = File(None),  # 파일 optional
    tech_stack: str = Form(None),
    tags: str = Form(None),
    education: str = Form(None),
    intro: str = Form(None),
    career_summary: str = Form(None),
    phone: str = Form(None),
    location: str = Form(None),
    birth: str = Form(None),
    portfolio_url: str = Form(None),
    is_public: bool = Form(True)
):
    user = await User.objects.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="유저 없음")

    profile = await UserProfile.objects.get_or_none(user=user)
    if not profile:
        raise HTTPException(status_code=404, detail="프로필 없음")

    # 1. S3 이미지 업로드
    if profile_image is not None:
        ext = profile_image.filename.split('.')[-1]
        s3_key = f"profile_images/{uuid.uuid4()}.{ext}"
        file_content = await profile_image.read()
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=profile_image.content_type,
            
        )

        s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key
            },
            ExpiresIn=3600  # 예: 1시간 유효
        )
        profile.profile_image = s3_key

        
    # 2. JSON 등 값들 갱신 (프론트에서 배열은 JSON.stringify해서 보내야 함)
    if tech_stack is not None and tech_stack != "":
        try:
            profile.tech_stack = json.loads(tech_stack)
        except json.JSONDecodeError:
            profile.tech_stack = [tech_stack]
    if tags is not None and tags != "":
        try:
            profile.tags = json.loads(tags)
        except json.JSONDecodeError:
            profile.tags = [tags]

    if education is not None and education != "":
        profile.education = education
    if intro is not None and intro != "":
        profile.intro = intro
    if career_summary is not None and career_summary != "":
        profile.career_summary = career_summary
    if phone is not None and phone != "":
        profile.phone = phone
    if location is not None and location != "":
        profile.location = location
    if birth is not None and birth != "":
        profile.birth = birth
    if portfolio_url is not None and portfolio_url != "":
        profile.portfolio_url = portfolio_url
    if is_public is not None:
        profile.is_public = is_public

    await profile.update()
    response_data = {"detail": "프로필 업데이트 완료"}
    if profile.profile_image:
        current_presigned_url = generate_presigned_url(BUCKET_NAME, profile.profile_image)
        response_data["profile_image_url"] = current_presigned_url
    
    return response_data

calendar_router = APIRouter()

@calendar_router.post("/")
async def create_calendar_event(data: CalendarCreate):
    key = f"calendar:{data.user_id}"
    now = datetime.now().isoformat()

    event_data = data.dict()
    event_data["created_at"] = now

    # datetime -> string 변환
    event_data["start"] = event_data["start"].isoformat()
    event_data["end"] = event_data["end"].isoformat()

    await r.rpush(key, json.dumps(event_data))
    return {"message": "이벤트 저장 완료"}

@calendar_router.get("/{user_id}")  # /calendar/{user_id}
async def get_calendar_events(user_id: str):
    key = f"calendar:{user_id}"
    raw_events = await r.lrange(key, 0, -1)
    return [json.loads(e) for e in raw_events]

# 라우터 등록
app.include_router(calendar_router, prefix="/calendar")

# ───────────── 캘린더 이벤트 삭제제 API ───────────── #
@calendar_router.delete("")
async def delete_calendar_event(data: CalendarDelete):
    key = f"calendar:{data.user_id}"
    raw_events = await r.lrange(key, 0, -1)

    # 삭제 타겟 찾기
    for idx, raw in enumerate(raw_events):
        event = json.loads(raw)
        if event.get("created_at") == data.created_at.isoformat():
            await r.lrem(key, 1, raw)
            return {"message": "이벤트 삭제 완료"}

    return {"message": "삭제할 이벤트를 찾을 수 없습니다."}

