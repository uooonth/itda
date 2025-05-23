CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    pw_hash TEXT,
    email TEXT UNIQUE
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    classification TEXT
);

CREATE TABLE project_info (
    id TEXT PRIMARY KEY REFERENCES projects(id),
    explain TEXT,
    sign_deadline DATE,
    salary_type TEXT,
    education TEXT,
    email TEXT,
    proposer TEXT,
    worker TEXT,
    thumbnail TEXT
);




CREATE TABLE todo (
    id TEXT PRIMARY KEY,
    text TEXT,
    user TEXT REFERENCES users(id),
    deadline DATE,
    start_day DATE
);

CREATE TABLE project_tag (
    tag_name TEXT,
    project_id TEXT REFERENCES projects(id),
    PRIMARY KEY (tag_name, project_id)
);

CREATE TABLE calendar (
    id TEXT PRIMARY KEY,
    text TEXT,
    date DATE,
    owner TEXT REFERENCES users(id),
    is_repeat BOOLEAN,
    in_project TEXT REFERENCES project_infos(id)
);

CREATE TABLE chat (
    id TEXT PRIMARY KEY,
    sender TEXT,
    receiver TEXT,
    message TEXT,
    timestamp TEXT
);

CREATE TABLE project_folders (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    project_id INTEGER NOT NULL REFERENCES project_infos(id),
    parent_id INTEGER 
);


CREATE TABLE uploaded_files (
    id SERIAL PRIMARY KEY,
    name TEXT,
    s3_key TEXT,
    s3_url TEXT,
    sixe INTEGER,
    project_id INTEGER REFERENCES project_info(id),
    uploader TEXT REFERENCES users(id),
    folder INTEGER REFERENCES project_folders(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP
);
