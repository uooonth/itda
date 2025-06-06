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
    
class ChatStore:
    @staticmethod
    async def save_message(project_id: str, data: dict):
        key = f"chat:project:{project_id}"
        await r.rpush(key, data)

    @staticmethod
    async def get_messages(project_id: str):
        key = f"chat:project:{project_id}"
        return await r.lrange(key, 0, -1)