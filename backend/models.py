from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, Float, Boolean, DateTime, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class RoleEnum(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.PATIENT, nullable=False)
    
    reports = relationship("Report", back_populates="patient", foreign_keys="Report.patient_id")
    clinical_notes = relationship("ClinicalNote", back_populates="doctor", foreign_keys="ClinicalNote.doctor_id")
    shares_created = relationship("ReportShare", back_populates="patient", foreign_keys="ReportShare.patient_id")
    shares_received = relationship("ReportShare", back_populates="doctor", foreign_keys="ReportShare.doctor_id")
    reports_reviewed = relationship("Report", back_populates="reviewer", foreign_keys="Report.reviewed_by_id")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, default="uploaded") # uploaded, processed, verified
    ai_summary = Column(Text, nullable=True)     # <--- ADDED THIS FIELD
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    patient = relationship("User", back_populates="reports", foreign_keys=[patient_id])
    extractions = relationship("ExtractedValue", back_populates="report", cascade="all, delete-orphan")
    clinical_note = relationship("ClinicalNote", back_populates="report", uselist=False, cascade="all, delete-orphan")
    shares = relationship("ReportShare", back_populates="report", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="report", cascade="all, delete-orphan")
    reviewer = relationship("User", back_populates="reports_reviewed", foreign_keys=[reviewed_by_id])

class ExtractedValue(Base):
    __tablename__ = "extracted_values"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    test_name = Column(String, nullable=False)
    result_value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    reference_range = Column(String, nullable=True)
    is_out_of_range = Column(Boolean, default=False)
    evidence_snippet = Column(Text, nullable=True) # Source snippet from OCR
    is_verified = Column(Boolean, default=False)
    corrected_value = Column(String, nullable=True)
    
    report = relationship("Report", back_populates="extractions")

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="clinical_note")
    doctor = relationship("User", back_populates="clinical_notes", foreign_keys=[doctor_id])

class ReportShare(Base):
    __tablename__ = "report_shares"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, nullable=False, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    report = relationship("Report", back_populates="shares")
    patient = relationship("User", back_populates="shares_created", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="shares_received", foreign_keys=[doctor_id])

Index("ix_report_shares_access", ReportShare.report_id, ReportShare.doctor_id, ReportShare.expires_at, ReportShare.revoked_at)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    report = relationship("Report", back_populates="audit_events")
    actor = relationship("User")
