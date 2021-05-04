DROP TABLE IF EXISTS ftdstats;
DROP TABLE IF EXISTS ftduser;

CREATE TABLE ftduser (
	username VARCHAR(20) PRIMARY KEY,
	password BYTEA NOT NULL,
	email VARCHAR(256) NOT NULL CHECK (LENGTH(email)>=3), 
    phone VARCHAR(256) NOT NULL CHECK (LENGTH(phone)=12), 
    birthday DATE NOT NULL, 
	level VARCHAR(256) NOT NULL CHECK(level = 'easy' OR level = 'medium' OR level = 'hard'), 
    privacy BOOLEAN NOT NULL CHECK(privacy = TRUE)
);

CREATE TABLE ftdstats (
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	username VARCHAR(20),
	level VARCHAR(256) NOT NULL CHECK(level = 'easy' OR level = 'medium' OR level = 'hard'),
	score INTEGER NOT NULL CHECK (score>=0),
	enemies INTEGER NOT NULL CHECK (enemies>=0),
	PRIMARY KEY(created_at, username)
);

