from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

# 自作モジュール
from . import models, database

router = APIRouter()

# --- Schemas ---
class ProjectCreate(BaseModel):
    name: str
    client: str
    period: str | None = None
    budget: int
    status: str

class ProjectSchema(BaseModel):
    id: int
    name: str
    client: str
    period: str | None
    budget: int
    status: str
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/projects", response_model=List[ProjectSchema])
def get_projects(db: Session = Depends(database.get_db)):
    return db.query(models.Project).all()

@router.post("/projects", response_model=ProjectSchema)
def create_project(project: ProjectCreate, db: Session = Depends(database.get_db)):
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.put("/projects/{project_id}", response_model=ProjectSchema)
def update_project(project_id: int, project: ProjectCreate, db: Session = Depends(database.get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    for key, value in project.model_dump().items():
        setattr(db_project, key, value)

    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(database.get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(db_project)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)