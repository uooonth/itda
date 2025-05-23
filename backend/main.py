from fastapi import FastAPI,status,Depends, APIRouter
from backend.db import database, User,ProjectInfo, ProjectOutline
from contextlib import asynccontextmanager
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse, ProjectOut
from typing import List
from fastapi import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from backend.db import User, ProjectInfo
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional
from fastapi.security import OAuth2PasswordBearer
from fastapi import Query
from .email_routes import router as email_router
from ormar.exceptions import NoMatch



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
@app.get("/projects", response_model=List[ProjectOut])
async def get_projects():
    projects = await ProjectInfo.objects.select_related("project").all()
    return projects

from fastapi import HTTPException

@app.post("/projects", response_model=ProjectOut)
async def create_project(project: ProjectCreate):
    # proposer 리스트 검증
    for proposer_id in project.proposer:
        user = await User.objects.get_or_none(id=proposer_id)
        if user is None:
            raise HTTPException(status_code=400, detail=f"프로포저 '{proposer_id}'가 존재하지 않습니다.")

    # worker 리스트 검증
    for worker_id in project.worker:
        user = await User.objects.get_or_none(id=worker_id)
        if user is None:
            raise HTTPException(status_code=400, detail=f"워커 '{worker_id}'가 존재하지 않습니다.")

    # ProjectOutline 존재 여부 확인 혹은 새로 생성
    outline = await ProjectOutline.objects.get_or_none(id=project.id)
    if outline is None:
        outline = await ProjectOutline.objects.create(
            id=project.id,
            name=project.name,
            classification=project.classification
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
        roles=project.roles,
        thumbnail=project.thumbnail,
        recruit_number=project.recruit_number,
        career=project.career,
        contract_until=project.contract_until
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
