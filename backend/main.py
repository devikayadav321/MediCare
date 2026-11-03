import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from migrations import run_migrations
from routers import auth_router, report_router

load_dotenv()
run_migrations()

allowed_origins = [origin.strip() for origin in os.getenv(
    "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if origin.strip()]

app = FastAPI(
    title="AI-Assisted Medical Report Verification Backend",
    version="1.0.0"
)

# Enable CORS for Frontend Connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(report_router.router)

@app.get("/")
def root():
    return {"message": "Medical Platform Backend is running successfully!"}
