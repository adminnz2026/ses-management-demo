from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 接続情報: mysql+pymysql://ユーザー名:パスワード@ホスト:ポート/データベース名
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://d_ttfrtuat1:ttfrtpass1@ttfuatsrv04:3306/ses_management_demo"

# エンジンの作成
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # 接続切れ対策
    echo=False           # SQLログを出力したい場合はTrue
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