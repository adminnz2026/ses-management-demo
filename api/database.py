import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. 优先从环境变量读取（Vercel 控制台设置），如果没有则使用你的备用连接串
# 这样即便密码改了，你也不用改代码，直接在 Vercel 后台改 ENV 即可
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://45WBt8b8nAYyPaa.root:PfZnHLKtUC03ES9D@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/ses_management_demo"
)

# 确保协议包含 +pymysql（防止环境变量里漏写）
if SQLALCHEMY_DATABASE_URL.startswith("mysql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("mysql://", "mysql+pymysql://")

# 2. SSL 证书路径处理
# Vercel (Linux) 的标准路径
CA_PATH = "/etc/ssl/certs/ca-certificates.crt"

connect_args = {}
# 只有当证书文件存在时才加载 SSL 配置（防止本地 Windows 环境崩溃）
if os.path.exists(CA_PATH):
    connect_args = {"ssl": {"ca": CA_PATH}}
    # 如果 URL 里没带 SSL 参数，手动补上
    if "ssl_ca" not in SQLALCHEMY_DATABASE_URL:
        if "?" in SQLALCHEMY_DATABASE_URL:
            SQLALCHEMY_DATABASE_URL += f"&ssl_ca={CA_PATH}"
        else:
            SQLALCHEMY_DATABASE_URL += f"?ssl_ca={CA_PATH}"

# 3. 创建引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,   # 解决你之前 Java 项目中遇到的“死连接”问题
    pool_recycle=300,     # TiDB Serverless 建议在 5 分钟内回收连接
    pool_size=5,          # Serverless 环境不需要太大的连接池
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# DBセッション依存関係 (Dependency)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        # 这里的 close() 非常关键！
        # 就像你之前优化 Java 程序一样，确保每个请求结束后资源都能立即释放
        db.close()