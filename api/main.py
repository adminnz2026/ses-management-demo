import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

# 导入你的模块
# 在 Vercel 环境下，建议使用相对导入（.）
try:
    from . import models, database, members, projects, assignments
except ImportError:
    # 本地开发时的兼容处理
    import models, database, members, projects, assignments

app = FastAPI()

# 1. CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 路由集成
app.include_router(members.router)
app.include_router(projects.router)
app.include_router(assignments.router)

# 3. 统计接口 (Dashboard Stats)
@app.get("/api/stats")
def get_stats(db: Session = Depends(database.get_db)):
    try:
        total_members = db.query(models.Member).count()
        active_members = db.query(models.Member).filter(models.Member.status == "稼働中").count()
        total_projects = db.query(models.Project).filter(models.Project.status == "進行中").count()

        projects_all = db.query(models.Project).all()
        # 确保 budget 为 None 时不报错
        total_revenue = sum(p.budget for p in projects_all if p.budget is not None)

        utilization_rate = int((active_members / total_members) * 100) if total_members > 0 else 0

        return {
            "utilization_rate": utilization_rate,
            "total_projects": total_projects,
            "total_revenue_forecast": total_revenue
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. 健康检查接口 (修复 NameError)
@app.get("/api/health")
def health_check():
    db_ok = False
    try:
        # 注意：这里必须用 database.engine，因为 engine 定义在 database.py 里
        if hasattr(database, 'engine') and database.engine is not None:
            with database.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                db_ok = True
    except Exception as e:
        print(f"Health check DB error: {e}")

    return {
        "status": "ok",
        "db_connected": db_ok,
        "runtime": "Vercel Serverless"
    }