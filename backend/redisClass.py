import redis
from pydantic import BaseModel
import redis.asyncio as redis
from typing import List

# ───────────── redis 설정 ───────────── #
r = redis.Redis(host='itda_redis', port=6379, db=0, decode_responses=True)


class Notice(BaseModel):
    content: str
    
class FeedbackMessage(BaseModel):
    user: str
    message: str
    timestamp: str


class FeedbackStore:
    @staticmethod
    async def save_message(project_id: int, file_id: int, message: FeedbackMessage):
        key = f"feedback:{project_id}:{file_id}"
        await r.rpush(key, message.json())  

    @staticmethod
    async def get_messages(project_id: int, file_id: int) -> List[FeedbackMessage]:
        key = f"feedback:{project_id}:{file_id}"
        raw_list = await r.lrange(key, 0, -1)
        return [FeedbackMessage.parse_raw(item) for item in raw_list]
    
    
class TodoProgressStore:
    @staticmethod
    async def set_progress(todo_id: str, progress: int):
        progress = max(0, min(100, progress))  # 0-100 범위 제한
        key = f"todo_progress:{todo_id}"
        await r.set(key, progress)
        
    @staticmethod
    async def get_progress(todo_id: str) -> int:
        key = f"todo_progress:{todo_id}"
        progress = await r.get(key)
        return int(progress) if progress else 0
    
    @staticmethod
    async def delete_progress(todo_id: str):
        key = f"todo_progress:{todo_id}"
        await r.delete(key)
        
class TodoParticipantStore:
    @staticmethod
    async def add_participant(todo_id: str, user_id: str):
        key = f"todo_participants:{todo_id}"
        await r.sadd(key, user_id)
        
    @staticmethod
    async def remove_participant(todo_id: str, user_id: str):
        key = f"todo_participants:{todo_id}"
        await r.srem(key, user_id)
        
    @staticmethod
    async def get_participants(todo_id: str) -> List[str]:
        key = f"todo_participants:{todo_id}"
        participants = await r.smembers(key)
        return list(participants)
    
    @staticmethod
    async def set_participants(todo_id: str, user_ids: List[str]):
        key = f"todo_participants:{todo_id}"
        await r.delete(key)  # 기존 참여자 모두 제거
        if user_ids:
            await r.sadd(key, *user_ids)
    
    @staticmethod
    async def delete_all_participants(todo_id: str):
        key = f"todo_participants:{todo_id}"
        await r.delete(key)
        
        
        
        
class TodoStyleStore:
    @staticmethod
    async def set_background_color(todo_id: str, color: str):
        key = f"todo_style:{todo_id}"
        await r.hset(key, "background_color", color)
        
    @staticmethod
    async def get_background_color(todo_id: str) -> str:
        key = f"todo_style:{todo_id}"
        color = await r.hget(key, "background_color")
        return color if color else "#ffffff"  # 기본 흰색
    
    @staticmethod
    async def delete_style(todo_id: str):
        key = f"todo_style:{todo_id}"
        await r.delete(key)

class ChatStore:
    @staticmethod
    async def save_message(project_id: str, data: dict):
        key = f"chat:project:{project_id}"
        await r.rpush(key, data)

    @staticmethod
    async def get_messages(project_id: str):
        key = f"chat:project:{project_id}"
        return await r.lrange(key, 0, -1)

