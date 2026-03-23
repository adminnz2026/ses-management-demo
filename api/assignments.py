from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

# 自作モジュール
from . import models, database

router = APIRouter()

# --- Schemas ---
class AssignmentCreate(BaseModel):
    member_id: int
    project_id: int
    month: str
    rate: int

class AssignmentSchema(BaseModel):
    id: int
    member_id: int
    member_name: str | None = None
    project_id: int
    project_name: str | None = None
    month: str
    rate: int
    class Config:
        from_attributes = True

# --- Helper Functions ---
def update_member_status_by_assignment(db: Session, member_id: int):
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        return

    # 「離任」の場合は自動更新しない
    if member.status == "離任":
        return

    assign_count = db.query(models.Assignment).filter(models.Assignment.member_id == member_id).count()
    new_status = "稼働中" if assign_count > 0 else "待機中"

    if member.status != new_status:
        member.status = new_status
        db.add(member)
        db.commit()
        db.refresh(member)

# --- Endpoints ---

@router.get("/assignments", response_model=List[AssignmentSchema])
def get_assignments(db: Session = Depends(database.get_db)):
    assignments = db.query(models.Assignment).all()
    results = []
    for a in assignments:
        results.append({
            "id": a.id,
            "member_id": a.member_id,
            "project_id": a.project_id,
            "month": a.month,
            "rate": a.rate,
            "member_name": a.member.name if a.member else "Unknown",
            "project_name": a.project.name if a.project else "Unknown"
        })
    return results

@router.post("/assignments", response_model=AssignmentSchema)
def create_assignment(assign: AssignmentCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.Assignment).filter(
        models.Assignment.member_id == assign.member_id,
        models.Assignment.project_id == assign.project_id,
        models.Assignment.month == assign.month
    ).first()

    target_assign = None

    if existing:
        existing.rate = assign.rate
        target_assign = existing
    else:
        target_assign = models.Assignment(**assign.model_dump())
        db.add(target_assign)

    db.commit()
    db.refresh(target_assign)

    # ステータス自動更新
    update_member_status_by_assignment(db, assign.member_id)

    return {
        "id": target_assign.id,
        "member_id": target_assign.member_id,
        "project_id": target_assign.project_id,
        "month": target_assign.month,
        "rate": target_assign.rate,
        "member_name": target_assign.member.name if target_assign.member else "Unknown",
        "project_name": target_assign.project.name if target_assign.project else "Unknown"
    }

@router.delete("/assignments")
def delete_assignment(member_id: int, project_id: int, month: str, db: Session = Depends(database.get_db)):
    db_assign = db.query(models.Assignment).filter(
        models.Assignment.member_id == member_id,
        models.Assignment.project_id == project_id,
        models.Assignment.month == month
    ).first()

    if db_assign:
        db.delete(db_assign)
        db.commit()
        # 削除後もステータス更新
        update_member_status_by_assignment(db, member_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)