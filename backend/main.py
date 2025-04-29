from fastapi import FastAPI
from backend.db import database, User,ProjectInfo, ProjectOutline
from contextlib import asynccontextmanager
from backend.schemas import UserCreate,ProjectOut,ProjectCreate,ProjectOutlineOut
from fastapi import HTTPException
from typing import List
from fastapi import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from backend.db import User
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

# ───────────── 유저 API ───────────── #
# 언니에게... 비번저장할때 해시저장 플리쥬...
#create 
@app.post("/users", response_model=UserCreate)
async def create_user(user: UserCreate):
    existing = await User.objects.get_or_none(id=user.id)
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자입니다.")
    
    new_user = await User.objects.create(**user.dict())
    return new_user
print("🟢 main.py")

#read
@app.get("/users", response_model=List[UserCreate])
async def get_users():
    users = await User.objects.all()
    return users
#delete
@app.delete("/users/{user_id}")
async def delete_user(user_id: str = Path(..., description="삭제할 사용자의 ID")):
    user = await User.objects.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    await user.delete()
    return {"message": f"사용자 '{user_id}'가 삭제되었습니다."}

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
        raise HTTPException(status_code=400, detail="제안자(proposer) 유저가 존재하지 않습니다.")
    
    # worker 검증
    worker_user = await User.objects.get_or_none(id=project.worker)
    if worker_user is None:
        raise HTTPException(status_code=400, detail="작업자(worker) 유저가 존재하지 않습니다.")
    
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