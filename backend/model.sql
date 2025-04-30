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

CREATE TABLE uploaded_file (
    name TEXT PRIMARY KEY,
    extension TEXT,
    owner TEXT REFERENCES users(id),
    project TEXT REFERENCES projects(id),
    comment JSONB
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
    in_project TEXT REFERENCES projects(id)
);

CREATE TABLE chat (
    id TEXT PRIMARY KEY,
    sender TEXT,
    receiver TEXT,
    message TEXT,
    timestamp TEXT
);
