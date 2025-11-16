-- Migration: 0001_initial_schema
-- Created: 2025-01-14
-- Description: Initial database schema for AAE Dashboard

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openId TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  lastSignedIn INTEGER NOT NULL
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL REFERENCES users(id),
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  defaultView TEXT DEFAULT 'dashboard',
  notificationsEnabled INTEGER DEFAULT 1,
  preferences TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- API connections table
CREATE TABLE IF NOT EXISTS api_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL REFERENCES users(id),
  service TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  apiKey TEXT,
  apiUrl TEXT,
  lastSynced INTEGER,
  errorMessage TEXT,
  metadata TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Cached queries table
CREATE TABLE IF NOT EXISTS cached_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL REFERENCES users(id),
  queryType TEXT NOT NULL,
  queryParams TEXT NOT NULL,
  result TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT,
  details TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_openId ON users(openId);
CREATE INDEX IF NOT EXISTS idx_user_preferences_userId ON user_preferences(userId);
CREATE INDEX IF NOT EXISTS idx_api_connections_userId ON api_connections(userId);
CREATE INDEX IF NOT EXISTS idx_api_connections_service ON api_connections(service);
CREATE INDEX IF NOT EXISTS idx_cached_queries_userId ON cached_queries(userId);
CREATE INDEX IF NOT EXISTS idx_cached_queries_expiresAt ON cached_queries(expiresAt);
CREATE INDEX IF NOT EXISTS idx_activity_log_userId ON activity_log(userId);
CREATE INDEX IF NOT EXISTS idx_activity_log_createdAt ON activity_log(createdAt);
