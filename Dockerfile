FROM python:3.11-slim

# 컨테이너 작업 디렉토리
WORKDIR /app

# requirements 복사 및 설치
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# backend 폴더 전체 복사
COPY backend /app/backend

# backend를 Python path에 추가 (중요)
ENV PYTHONPATH=/app

# FastAPI 실행 위치 이동
WORKDIR /app/backend

# Cloud Run 포트
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]










