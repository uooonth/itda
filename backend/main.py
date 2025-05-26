from fastapi import FastAPI,status,Depends
from backend.db import database, User,ProjectInfo, ProjectOutline, UploadedFile, Calendar, Chat, Todo
from backend.db import Calendar as CalendarModel
from uuid import uuid4
from contextlib import asynccontextmanager
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, CalendarCreate, ChatMessage, FeedbackChatMessage, LiveChatMessage
from fastapi import HTTPException
from typing import List
from fastapi import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional
from fastapi.security import OAuth2PasswordBearer
from backend.redisClass import Notice
import redis
import json


# ───────────── Docker 생명주기 설정 ───────────── #
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)

# ───────────── redis 설정 ───────────── #
r = redis.Redis(host='itda_redis', port=6379, db=0, decode_responses=True)

# ───────────── 3000포트에서 이쪽 주소를 쓸 수 있게 해주는 CORS설정 ───────────── #
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ───────────── 회원가입 API ───────────── #
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@app.post("/signup", response_model=UserCreate)
async def signup(user: UserCreate):
    existing_user = await User.objects.get_or_none(email=user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="이미 가입된 이메일"
        )
 
    hashed_password = get_password_hash(user.pw_hash)

    new_user = await User.objects.create(
        id=user.id,          
        name=user.name,     
        pw_hash=hashed_password,
        email=user.email
    )
    
    return new_user


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

@app.post("/projects", response_model=ProjectOut)
async def create_project(project: ProjectCreate):
    # proposer 검증
    proposer_user = await User.objects.get_or_none(id=project.proposer)
    if proposer_user is None:
        raise HTTPException(status_code=400, detail="프로포잘오류")
    
    # worker 검증
    worker_user = await User.objects.get_or_none(id=project.worker)
    if worker_user is None:
        raise HTTPException(status_code=400, detail="워커오류")
    
    # ProjectOutline 생성
    outline = await ProjectOutline.objects.create(
        id=project.project,
        name=project.name,
        classification="default"
    )

    # ProjectInfo 생성
    new_project = await ProjectInfo.objects.create(
        project=outline,
        explain=project.explain,
        sign_deadline=project.sign_deadline,
        salary_type=project.salary_type.value,
        education=project.education.value,
        email=project.email,
        proposer=project.proposer,
        worker=project.worker,
        thumbnail=project.thumbnail
    )

    return await ProjectInfo.objects.select_related("project").get(id=new_project.id)

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
    r.set(redis_key, notice.content)
    return {"{project_id}에 공지사항이 설정"}

# 공지사항 가져오기 API
@app.get("/project/{project_id}/notice")
async def get_notice(project_id: str):
    redis_key = f"project:공지:{project_id}"
    notice = r.get(redis_key)
    if notice:
        return {"project_id": project_id, "content": notice}
    else:
        raise HTTPException(status_code=404, detail="공지사항이 없습니다.")
    
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