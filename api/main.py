import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

# 导入你项目中的其他模块
# 注意：Vercel 环境下建议使用相对导入 . 
try:
    from . import models, database, members, projects, assignments
except ImportError:
    # 本地直接运行时的兼容处理
    import models, database, members, projects, assignments

app = FastAPI(title="SES Management System API")

# --- 1. CORS 配置 ---
# 允许 React 前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议替换为你的 Vercel 域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. 路由集成 ---
app.include_router(members.router)
app.include_router(projects.router)
app.include_router(assignments.router)

# --- 3. 业务逻辑接口 (Dashboard Stats) ---

@app.get("/api/stats")
def get_stats(db: Session = Depends(database.get_db)):
    try:
        total_members = db.query(models.Member).count()
        active_members = db.query(models.Member).filter(models.Member.status == "稼働中").count()

        # 正在进行中的项目
        total_projects = db.query(models.Project).filter(models.Project.status == "進行中").count()

        # 预算合计 (处理空数据情况)
        projects_all = db.query(models.Project).all()
        total_revenue = sum(p.budget for p in projects_all if p.budget)

        utilization_rate = int((active_members / total_members) * 100) if total_members > 0 else 0

        return {
            "utilization_rate": utilization_rate,
            "total_projects": total_projects,
            "total_revenue_forecast": total_revenue
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")

# --- 4. 健康检查接口 (修复了 NameError 并增加连接测试) ---

@app.get("/api/health")
def health_check():
    db_status = False
    error_msg = None

    try:
        # 检查 database 模块中是否存在 engine
        if hasattr(database, 'engine') and database.engine is not None:
            # 尝试执行一个极简查询来确认 TiDB 真正连通
            with database.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                db_status = True
        else:
            error_msg = "Database engine not initialized in database.py"
    except Exception as e:
        error_msg = str(e)

    return {
        "status": "ok",
        "db_connected": db_status,
        "database_url_configured": os.getenv("DATABASE_URL") is not None,
        "error": error_msg
    }

# --- 5. 根路径重定向或欢迎页 (防止直接访问域名报 404) ---
@app.get("/")
def read_root():
    return {"message": "Welcome to SES Management API", "docs": "/docs"}