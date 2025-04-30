from fastapi import FastAPI,status,Depends
from backend.db import database, User,ProjectInfo, ProjectOutline
from contextlib import asynccontextmanager
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,UserLogin, Token,UserResponse
from fastapi import HTTPException
from typing import List
from fastapi import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from backend.db import User
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional
from fastapi.security import OAuth2PasswordBearer



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

# ───────────── Front 연결 test ───────────── #

@app.get("/users/1")
def get_first_user():
    return {"username": "서지혜"}

## ───────────── 회원가입 API ───────────── #
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@app.post("/signup", response_model=UserCreate)
async def signup(user: UserCreate):
    existing_user = await User.objects.get_or_none(email=user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="이미 가입된 이메일입니다."
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

@app.get("/projects", response_model=List[ProjectOut])
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