CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT,
  age INTEGER,
  calorie_goal INTEGER,
  current_weight INTEGER,
  weight_goal INTEGER,
  onboarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS days (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  values_json TEXT NOT NULL,
  water_glasses_json TEXT NOT NULL,
  weight TEXT,
  day_ended INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, date)
);
