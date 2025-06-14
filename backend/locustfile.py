from locust import HttpUser, task, between
import json

class ItdaUser(HttpUser):
    wait_time = between(1, 2)  # 요청 간 간격

    def on_start(self):
        # 로그인 요청 (ID/PW는 실제 존재하는 계정으로 대체)
        response = self.client.post("/login", json={
            "id": "test1",
            "password": "test1test1test1"
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {token}"}
        else:
            self.headers = {}

    @task(2)
    def get_todos(self):
        self.client.get("/todos", headers=self.headers)

    @task(1)
    def get_projects(self):
        self.client.get("/projects", headers=self.headers)
