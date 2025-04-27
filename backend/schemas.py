from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    id: str
    name: str
    pw_hash: str  #나중에 해시값으로 바꾸는 거 만들기
    email: EmailStr