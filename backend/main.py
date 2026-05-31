import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.connection import init_db
from routes import analytics, ml, nlp, upload

load_dotenv()

app = FastAPI(
    title="AI Data Analytics Dashboard API",
    description="Upload CSV, analyze data, visualize, train ML models, and run NLP insights.",
    version="1.0.0",
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analytics.router)
app.include_router(ml.router)
app.include_router(nlp.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "AI Data Analytics Dashboard API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
