FROM python:3.11-slim

# 앱 폴더 생성
WORKDIR /app

# backend 폴더 아래의 requirements.txt 복사
COPY backend/requirements.txt .

# 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# backend 전체를 /app/backend 로 복사
COPY backend /app/backend

# FastAPI가 실행될 위치로 이동
WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1

# Cloud Run PORT(=8080)에서 listen
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]







