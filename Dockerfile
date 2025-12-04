# Use Python base image
FROM python:3.10-slim

# Set workdir
WORKDIR /app

# Copy backend code
COPY backend/ ./backend/

# Install dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Expose port
EXPOSE 8000

# Correct CMD syntax (JSON array - all strings)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]


