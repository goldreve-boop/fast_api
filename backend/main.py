from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from backend.routers import (
    nielsen,
    promotion,
    customer,
    dispute,
    finance,
    material,
    claim
)

app = FastAPI(
    title="SCoP Backend API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(nielsen.router)
app.include_router(promotion.router)
app.include_router(customer.router)
app.include_router(dispute.router)
app.include_router(finance.router)
app.include_router(material.router)
app.include_router(claim.router)

@app.get("/")
def root():
    return {"message": "Backend is running"}
