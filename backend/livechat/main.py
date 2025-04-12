from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import redis
import json
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis 연결
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST"),
    port=int(os.getenv("REDIS_PORT")),
    decode_responses=True
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.user_counter = 0  # 익명 사용자 번호 카운터

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_counter += 1
        user_id = f"User{self.user_counter}"
        # Redis에서 기존 메시지 로드
        messages = redis_client.lrange("chat_messages", 0, -1)
        for msg in reversed(messages):  # 최신순으로 클라이언트에 전송
            await websocket.send_text(msg)
        await websocket.send_text(json.dumps({"username": user_id, "message": "Connected", "timestamp": datetime.now().isoformat()}))
        return user_id

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/messages")
def get_messages():
    messages = redis_client.lrange("chat_messages", 0, -1)
    return [json.loads(msg) for msg in reversed(messages)]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    user_id = await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message = message_data["message"]
            timestamp = datetime.now().isoformat()

            message_obj = {"username": user_id, "message": message, "timestamp": timestamp}
            redis_client.lpush("chat_messages", json.dumps(message_obj))
            redis_client.ltrim("chat_messages", 0, 99)  # 최대 100개 메시지만 유지

            await manager.broadcast(json.dumps(message_obj))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(json.dumps({"username": user_id, "message": "Disconnected", "timestamp": datetime.now().isoformat()}))