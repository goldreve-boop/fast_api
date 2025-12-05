FROM python:3.11-slim

# 컨테이너 내 작업 디렉토리
WORKDIR /app

# requirements 설치
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# backend 전체를 복사 (가장 중요)
COPY backend /app/backend

# backend를 PYTHONPATH에 추가
ENV PYTHONPATH=/app

# FastAPI 실행 위치 설정
WORKDIR /app/backend

# Cloud Run 포트 설정
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]








