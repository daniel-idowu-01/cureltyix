from sqlalchemy import Column, String, Integer, Boolean, Date, ForeignKey, Text, ARRAY, DateTime, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    avatar_url = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Patient(Base):
    __tablename__ = "patients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    date_of_birth = Column(Date)
    gender = Column(String)
    phone = Column(String)
    address = Column(String)
    created_at = Column(DateTime, default=func.now())

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    specialization = Column(String)
    license_number = Column(String)
    years_of_experience = Column(Integer, default=0)
    bio = Column(Text)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

class Symptom(Base):
    __tablename__ = "symptoms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True)
    category = Column(String)
    description = Column(Text)

class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"))
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=True)
    symptoms = Column(ARRAY(String))
    description = Column(Text)
    status = Column(String, default="pending")  # pending, assigned, completed, cancelled
    priority = Column(String, default="medium")  # urgent, high, medium, low
    ai_recommendation = Column(Text, default="")
    doctor_notes = Column(Text, default="")
    suggested_specialty = Column(String)
    follow_up_questions = Column(ARRAY(String))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"))
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"))
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)
    type = Column(String, nullable=False)  # video, in-person
    location = Column(String)
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String)  # info, warning, success, error
    is_read = Column(Boolean, default=False)
    link = Column(String)
    created_at = Column(DateTime, default=func.now())
