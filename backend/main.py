
from fastapi import FastAPI,status,Depends, APIRouter,Body,Request
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, ProjectOut
from backend.db import database, User,ProjectInfo, ProjectOutline, UploadedFile, Calendar, Chat, Todo,ProjectFolder, UserProfile
from backend.db import Calendar as CalendarModel
from uuid import uuid4
from contextlib import asynccontextmanager
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, CalendarCreate, ChatMessage, FeedbackChatMessage,UploadedFileCreate,TodoResponse,TodoCreate
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
from backend.redisClass import Notice,r,FeedbackStore,FeedbackMessage
import redis
import json
from fastapi import File, UploadFile, Form
from datetime import date
from fastapi.staticfiles import StaticFiles


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
    if current_user.id not in project.proposer:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")

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
        return {"project_id": project_id, "content": notice.decode('utf-8')}  # Redis는 bytes로 반환됨
    else:
        raise HTTPException(status_code=404, detail="공지사항이 없습니다.")
    
    
# ───────────── 플젝-투두-postgreSQL,redis ───────────── #


# 투두 생성 API
@app.post("/todos", response_model=Todo)
async def create_todo(todo: TodoCreate):
    todo_id = str(uuid.uuid4())
    new_todo = await Todo.objects.create(
        id=todo_id,
        text=todo.text,
        user={"id": todo.user_id},
        deadline=todo.deadline,
        start_day=todo.start_day
    )
    # Redis에 매핑 (Set 사용)
    r.sadd(f"project:{todo.project_id}:todos", todo_id)
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
    for key in r.keys("project:*:todos"):
        if key == f"project:{project_id}:todos":
            todo_ids = r.smembers(key)
            for todo_id in todo_ids:
                todo_status = r.get(f"todo_status:{todo_id}")
                if todo_status == status:
                    result.append(todo_id)

    return {"status": status, "todos": result}

# 투두 프로젝트 별 가져오기 api
@app.get("/projects/{project_id}/todos", response_model=List[TodoResponse])
async def get_todos_by_project(project_id: str):
    todo_ids = r.smembers(f"project:{project_id}:todos")

    if not todo_ids:
        return []

    result = []
    for todo_id in todo_ids:
        todo = await Todo.objects.get_or_none(id=todo_id)
        if todo:
            # 상태 가져오기
            status = r.get(f"todo_status:{todo_id}") or "in_progress"
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

# 투두 개별 가져오기 API
@app.get("/todos/{todo_id}", response_model=Todo)
async def get_todo(todo_id: str):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

# 투두 수정 API
@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: str, update_data: TodoCreate):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    await todo.update(
        text=update_data.text,
        user={"id": update_data.user_id},
        deadline=update_data.deadline,
        start_day=update_data.start_day
    )
    return todo

# 투두 삭제 API
@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, project_id: str):
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    await todo.delete()
    r.srem(f"project:{project_id}:todos", todo_id)
    return {"message": f"{todo_id} deleted successfully"}



# ───────────── 플젝-투두-상태변경crud───────────── #
VALID_STATUSES = ["in_progress", "completed", "waiting_feedback"]

@app.post("/todos/{todo_id}/status")
async def set_todo_status(todo_id: str, status: str):
    """
    Redis에 Todo 상태를 설정합니다.
    """
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # PostgreSQL에 실제로 Todo가 존재하는지 확인
    todo = await Todo.objects.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Redis에 상태 저장
    r.set(f"todo_status:{todo_id}", status)
    return {"message": f"{todo_id}의 상태가 '{status}'로 설정되었습니다."}


@app.get("/todos/{todo_id}/status")
async def get_todo_status(todo_id: str):
    """
    Redis에서 Todo 상태를 조회합니다.
    """
    status = r.get(f"todo_status:{todo_id}")
    if not status:
        raise HTTPException(status_code=404, detail="Status not found")
    return {"todo_id": todo_id, "status": status}


@app.get("/todos/status/{status}")
async def get_todos_by_status(status: str):
    """
    특정 상태에 해당하는 모든 Todo ID를 가져옵니다.
    """
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = []
    for key in r.keys("todo_status:*"):
        if r.get(key) == status:
            todo_id = key.split(":")[1]
            result.append(todo_id)
    return {"status": status, "todos": result}





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
        raise HTTPException(status_code=404, detail="zz")
    #S3삭제
    try:
        s3.delete_object(Bucket=BUCKET_NAME, Key=file.s3_key)
    except ClientError as e:
        raise HTTPException(status_code=500, detail="zz")
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


#testtest

"""    
# ───────────── 플젝 페이지 실시간 채팅 저장 API ───────────── #
@app.post("/livechat/send")
async def send_live_chat_message(msg: LiveChatMessage):
    # 양방향 키 만들기 (ex: user1↔user2)
    sorted_ids = sorted([msg.sender_id, msg.receiver_id])
    redis_key = f"livechat:{sorted_ids[0]}:{sorted_ids[1]}"
    message_data = {
        "sender_id": msg.sender_id,
        "text": msg.text,
        "time": msg.time.isoformat()
    }
    r.rpush(redis_key, json.dumps(message_data))
    return {"message": "메시지 저장 완료"}

# 채팅 불러오기 API
@app.get("/livechat/{user1}/{user2}") # 1대多 채팅방이라 일케 하면 안됨 수정 필요
async def get_live_chat_messages(user1: str, user2: str):
    sorted_ids = sorted([user1, user2])
    redis_key = f"livechat:{sorted_ids[0]}:{sorted_ids[1]}"
    messages = r.lrange(redis_key, 0, -1)
    return [json.loads(m) for m in messages]
"""
    
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


# ───────────── 채팅 페이지 채팅 저장 API ───────────── #
@app.post("/chat/send")
async def send_chat_message(msg: ChatMessage):
    redis_key = f"chat:project:{msg.project_id}"
    message_data = {
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "text": msg.text,
        "time": msg.time.isoformat()
    }
    r.rpush(redis_key, json.dumps(message_data))  # Redis에 메시지 저장
    return {"message": "메시지 저장 완료"}

# 채팅 불러오기 API
@app.get("/chat/{project_id}")
async def get_chat_messages(project_id: str):
    redis_key = f"chat:project:{project_id}"
    messages = r.lrange(redis_key, 0, -1)  # 전체 메시지 가져오기
    return [json.loads(m) for m in messages]


# ───────────── 캘린더 API ───────────── #
@app.post("/calendar/", status_code=status.HTTP_201_CREATED)
async def create_calendar_event(calendar: CalendarCreate):
    try:
        query = CalendarModel.insert().values(
            id=str(uuid4()),
            text=calendar.text,
            date=calendar.start.date(),
            owner=calendar.owner,
            is_repeat=calendar.is_repeat,
            in_project=calendar.in_project
        )
        await database.execute(query)
        return {"message": "일정이 성공적으로 추가되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일정 추가 실패: {str(e)}")
