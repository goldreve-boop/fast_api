FROM python:3.11-slim

# 컨테이너 안 작업 디렉토리
WORKDIR /app

# requirements 설치
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# backend 전체 복사
COPY backend ./backend

ENV PYTHONUNBUFFERED=1

# ❗ 여기서 'backend.main:app' 으로 실행하는 게 핵심
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]











