from fastapi import FastAPI
from backend.db import database, User
from contextlib import asynccontextmanager
from backend.schemas import UserCreate
from fastapi import HTTPException
from typing import List
from fastapi import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)

# ───────────── 유저 API ───────────── #
# 언니에게. .... 비번저장할때 해시저장 플리쥬...
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