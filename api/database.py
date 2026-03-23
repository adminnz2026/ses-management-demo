from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://45WBt8b8nAYyPaa.root:PfZnHLKtUC03ES9D@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/ses_management_demo?ssl_ca=/etc/ssl/certs/ca-certificates.crt"

# エンジン作成時の引数も TiDB 向けに調整
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"ssl": {"ca": "/etc/ssl/certs/ca-certificates.crt"}}, # VercelなどのLinux環境用
    pool_pre_ping=True,
    pool_recycle=300 # TiDB側で接続が切られるのを防ぐため短めに設定
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# DBセッション依存関係 (Dependency)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()