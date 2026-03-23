-- データベースを使用
USE ses_management_demo;

-- 既存のテーブルがあれば削除
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS members;

-- 1. 要員テーブル (members)
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '氏名',
    role VARCHAR(50) NOT NULL COMMENT '役割',
    status VARCHAR(50) NOT NULL DEFAULT '稼働中' COMMENT 'ステータス',
    skills TEXT COMMENT 'スキル',
    price INT NOT NULL DEFAULT 0 COMMENT '単価 (万円)',

    -- 【変更点】 デフォルト値を削除し、アプリケーションまたはINSERT文で指定する形式に変更
    created_at DATETIME NOT NULL,
    -- updated_at だけ TIMESTAMP の自動更新機能を使う（これなら1つだけなのでエラーにならない）
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='要員マスタ';

-- 2. 案件テーブル (projects)
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL COMMENT '案件名',
    client VARCHAR(100) NOT NULL COMMENT '顧客名',
    period VARCHAR(100) COMMENT '期間',
    budget INT NOT NULL DEFAULT 0 COMMENT '予算 (万円)',
    status VARCHAR(50) NOT NULL DEFAULT '進行中' COMMENT 'ステータス',

    -- 【変更点】
    created_at DATETIME NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案件マスタ';

-- 3. アサインテーブル (assignments)
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL COMMENT '要員ID',
    project_id INT NOT NULL COMMENT '案件ID',
    month CHAR(7) NOT NULL COMMENT '対象月 (YYYY-MM)',
    rate INT NOT NULL DEFAULT 100 COMMENT '稼働率 (%)',

    -- 【変更点】
    created_at DATETIME NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

    UNIQUE KEY unique_assignment (member_id, project_id, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='アサイン管理';

-- ==============================================
-- 初期データの投入
-- created_at に NOW() を明示的に指定します
-- ==============================================

INSERT INTO members (name, role, status, skills, price, created_at) VALUES
('佐藤 健一', 'PM', '稼働中', 'Java,AWS,PMP', 120, NOW()),
('田中 優子', 'SE', '稼働中', 'React,Python,Docker', 90, NOW()),
('鈴木 一郎', 'PG', '待機中', 'Java,Spring', 70, NOW()),
('高橋 未来', 'SE', '稼働中', 'Vue.js,PHP', 85, NOW()),
('伊藤 浩二', 'Infra', '稼働中', 'Azure,Terraform', 100, NOW());

INSERT INTO projects (name, client, period, budget, status, created_at) VALUES
('金融機関向け基幹システム刷新', '株式会社A銀行', '2023/04 - 2024/03', 5000, '進行中', NOW()),
('ECサイトリニューアル', 'Bリテール', '2023/09 - 2024/02', 2000, '進行中', NOW()),
('DXコンサルティング', 'C製造', '2023/10 - 2023/12', 1500, '準備中', NOW());

INSERT INTO assignments (member_id, project_id, month, rate, created_at) VALUES
(1, 1, '2023-10', 100, NOW()),
(1, 1, '2023-11', 100, NOW()),
(2, 2, '2023-10', 80, NOW()),
(2, 3, '2023-10', 20, NOW()),
(4, 2, '2023-10', 100, NOW());


-- 職歴 (長文用 TEXT型)
ALTER TABLE members ADD COLUMN job_history TEXT COMMENT '職歴詳細';

-- 資格 (文字列)
ALTER TABLE members ADD COLUMN qualifications VARCHAR(255) COMMENT '保有資格';

-- 評価 (1-5の数値, デフォルト3:普通)
ALTER TABLE members ADD COLUMN evaluation INT DEFAULT 3 COMMENT '評価(1-5)';

USE ses_management_demo;

-- 1. メンバーテーブルに「その他の項目」を保存するJSONカラムを追加
-- 既存のデータを消さずにカラムだけ足します
ALTER TABLE members ADD COLUMN custom_fields JSON COMMENT 'カスタム項目データ';

-- 2. 「どんな項目があるか」を管理する設定テーブルを作成
DROP TABLE IF EXISTS member_field_settings;
CREATE TABLE member_field_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_key VARCHAR(50) NOT NULL UNIQUE COMMENT '内部キー (例: github_url)',
    label VARCHAR(50) NOT NULL COMMENT '表示名 (例: GitHub URL)',
    field_type VARCHAR(20) NOT NULL DEFAULT 'text' COMMENT 'text, number, date, select',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='カスタム項目定義';

-- 初期データ（例としていくつか入れておきます）
INSERT INTO member_field_settings (field_key, label, field_type) VALUES
('nearest_station', '最寄駅', 'text'),
('interview_date', '面談可能日', 'date'),
('blood_type', '血液型', 'text');