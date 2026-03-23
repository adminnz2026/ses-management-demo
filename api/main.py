from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# 自作モジュール
from . import models, database
from . import members, projects, assignments  # 分割したファイルをインポート

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの統合
app.include_router(members.router)
app.include_router(projects.router)
app.include_router(assignments.router)

# --- Dashboard Stats (集計系なのでここに配置) ---

@app.get("/api/stats") # 显式包含 /api
def get_stats(db: Session = Depends(database.get_db)):
    total_members = db.query(models.Member).count()
    active_members = db.query(models.Member).filter(models.Member.status == "稼働中").count()
    total_projects = db.query(models.Project).filter(models.Project.status == "進行中").count()

    # 予算合計の計算
    projects_all = db.query(models.Project).all()
    total_revenue = sum(p.budget for p in projects_all)

    utilization_rate = int((active_members / total_members) * 100) if total_members > 0 else 0

    return {
        "utilization_rate": utilization_rate,
        "total_projects": total_projects,
        "total_revenue_forecast": total_revenue
    }