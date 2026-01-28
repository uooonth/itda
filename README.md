# 잇다 (itda) 🔗
크리에이터 협업 플랫폼

## 👥 팀원 소개

| <img src="https://github.com/uooonth.png" width="200px"> | <img src="https://github.com/seajihey.png" width="200px"> | <img src="https://github.com/byabbya.png" width="200px"> |
| :---: | :---: | :---: |
| [황윤성](https://github.com/uooonth) | [서지혜](https://github.com/seajihey) | [박지수](https://github.com/byabbya) |

---

## 📌 Project Overview

**잇다(itda)** 는 영상 제작자, 일러스트레이터, 음악 작곡가 등  
다양한 분야의 크리에이터들이 하나의 프로젝트를 중심으로 협업할 수 있도록 지원하는  
**크리에이터 협업 플랫폼**입니다.

사용자는 프로젝트를 등록하여 필요한 협업자를 모집하거나,  
다른 프로젝트에 참여하여 공동 작업을 진행할 수 있습니다.  
프로젝트 내에서는 **작업 관리, 일정 관리, 파일 공유, 피드백, 실시간 소통** 기능을 통합적으로 제공하며,  
프로젝트 참여 이력은 자동으로 정리되어 **포트폴리오 형태로 프로필에 기록**됩니다.

- Repository: https://github.com/uooonth/itda  
- Development Period: 2025.03.01 ~ 2025.06.12  

---

## 🎯 Background & Motivation

크리에이터 산업은 빠르게 성장하고 있지만, 실제 협업 환경은 여전히 많은 한계를 가지고 있습니다.

- 협업 파트너 탐색이 SNS나 지인 소개에 의존하여 신뢰성과 확장성이 낮음
- 파일 공유와 피드백이 이메일·메신저 등 여러 도구로 분산되어 관리가 어려움
- 일정 관리, 역할 분담, 작업 진행 현황을 한눈에 파악하기 어려움
- 협업 경험이 체계적으로 기록되지 않아 포트폴리오로 활용하기 어려움

특히 영상 콘텐츠 제작과 같은 협업 환경에서는  
기획자, 촬영자, 편집자, 디자이너 등 여러 역할이 동시에 참여하지만  
이를 효율적으로 관리할 수 있는 **크리에이터 특화 협업 플랫폼은 부족**한 상황입니다.

**itda**는 이러한 문제를 해결하기 위해  
협업 전 과정(모집 → 진행 → 기록)을 하나의 플랫폼에서 관리할 수 있도록 설계되었습니다.

---

## ✨ Key Features

### 1. Project Recruiting
- 프로젝트 등록 시 모집 인원, 필요 역할, 프로젝트 개요 입력
- 관심 분야 및 기술 스택 기반 프로젝트 검색 및 필터링
- 프로젝트 지원 / 승인 / 거절을 통한 팀 구성
- 즐겨찾기(찜) 및 모집 마감 임박 알림 제공

### 2. Task Management
- Kanban Board 기반 할 일 관리
  - 진행중 / 완료 / 피드백 대기중 상태 관리
  - Drag & Drop을 통한 상태 변경
- 개인별 작업 타임라인 제공
  - vis-timeline 기반 시각화
  - 작업 기간 및 담당자 기준 한눈에 파악 가능

### 3. File & Feedback
- 프로젝트 단위 폴더 트리 구조 제공
- AWS S3 기반 파일 업로드 및 저장
- presigned URL을 통한 안전한 파일 미리보기
- 파일 단위 피드백 관리
  - 피드백 메시지 내 타임스탬프(mm:ss) 자동 감지
  - 영상의 해당 시점으로 바로 이동 가능

### 4. Real-time Communication
- 프로젝트별 실시간 채팅
- 개인 채팅(채팅방 기반)
- WebSocket 기반 실시간 메시지 송수신

### 5. Calendar
- 개인 일정과 프로젝트 일정 통합 관리
- 일정 CRUD 기능 제공
- 프로젝트별 일정 필터링 지원

### 6. Notification
- 채팅, 파일 업로드, 마감 일정 등 주요 이벤트 알림 제공
- WebSocket 및 브라우저 Notification API 활용

### 7. Profile & Portfolio
- 프로젝트 참여 이력 자동 기록
- 역할, 작업물, 기술 스택 기반 포트폴리오 구성
- 사용자 검색 및 타 사용자 프로필 열람 가능

---

## 🛠 Tech Stack

**Frontend**
- React (SPA)
- vis-timeline
- dnd-kit
- WebSocket

**Backend**
- FastAPI (REST, WebSocket)
- PostgreSQL
- Redis
- JWT Authentication (OAuth2PasswordBearer)

**Infrastructure**
- Docker
- AWS EC2
- AWS S3 (presigned URL)

---

## 🎥 Demo
https://youtube.com/channel/UCJLJiTf9MXYvy5Q44FV3TfA?feature=shared

---

## 📈 Expected Impact

- 팀 단위 크리에이터 협업에 최적화된 통합 환경 제공
- 협업 도구 분산으로 인한 비효율 해소
- 협업 경험의 자동 기록을 통한 포트폴리오 활용성 향상
- 프리랜서, 스타트업, 콘텐츠 제작 스튜디오 등 다양한 분야에서 활용 가능
