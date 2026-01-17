from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.auth import router as auth_router
from app.routers import consultations, patients, doctors, symptoms, appointments, notifications

app = FastAPI(title="CurelyTix Backend API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Database startup
# -----------------------
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        print(" Database connected and tables created")
    except Exception as e:
        print(" Database connection failed:", e)


# Root endpoint

@app.get("/")
def root():
    return {
        "message": "CurelyTix API",
        "version": "1.0.0",
        "status": "running"
    }


# Health check

@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Routers

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(consultations.router, prefix="/consultations", tags=["Consultations"])
app.include_router(patients.router, prefix="/patients", tags=["Patients"])
app.include_router(doctors.router, prefix="/doctors", tags=["Doctors"])
app.include_router(symptoms.router, prefix="/symptoms", tags=["Symptoms"])
app.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
