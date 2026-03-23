from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Member(Base):
    __tablename__ = "members"
    id = Column(Integer, primary_key = True, index = True)
    name = Column(String(100))
    role = Column(String(50))
    status = Column(String(50))
    skills = Column(Text)
    price = Column(Integer)

    job_history = Column(Text)  # 職歴
    qualifications = Column(String(255))  # 資格
    evaluation = Column(Integer, default = 3)  # 評価

    created_at = Column(DateTime, default = func.now(), nullable = False)
    updated_at = Column(DateTime, default = func.now(), onupdate = func.now(), nullable = False)
    custom_fields = Column(JSON, nullable = True)
    assignments = relationship("Assignment", back_populates = "member")


class MemberFieldSetting(Base):
    __tablename__ = "member_field_settings"
    id = Column(Integer, primary_key = True, index = True)
    field_key = Column(String(50), unique = True)
    label = Column(String(50))
    field_type = Column(String(20))


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key = True, index = True)
    name = Column(String(200))
    client = Column(String(100))
    period = Column(String(100))
    budget = Column(Integer)
    status = Column(String(50))
    created_at = Column(DateTime, default = func.now(), nullable = False)
    updated_at = Column(DateTime, default = func.now(), onupdate = func.now(), nullable = False)
    assignments = relationship("Assignment", back_populates = "project")


class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key = True, index = True)
    member_id = Column(Integer, ForeignKey("members.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    month = Column(String(7))
    rate = Column(Integer)
    created_at = Column(DateTime, default = func.now(), nullable = False)
    updated_at = Column(DateTime, default = func.now(), onupdate = func.now(), nullable = False)

    member = relationship("Member", back_populates = "assignments")
    project = relationship("Project", back_populates = "assignments")
