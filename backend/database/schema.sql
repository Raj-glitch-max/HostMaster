-- HostMaster Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  aws_access_key_encrypted TEXT,
  aws_secret_key_encrypted TEXT,
  aws_region VARCHAR(50) DEFAULT 'us-east-1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- AWS Resources table
CREATE TABLE aws_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'ec2', 'rds', 's3', 'lambda'
  resource_id VARCHAR(255) NOT NULL,
  resource_name VARCHAR(255),
  region VARCHAR(50) NOT NULL,
  instance_type VARCHAR(100),
  state VARCHAR(50),
  monthly_cost DECIMAL(10, 2),
  metadata JSONB, -- Store additional resource details
  discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aws_resources_user ON aws_resources(user_id);
CREATE INDEX idx_aws_resources_type ON aws_resources(resource_type);

-- Cost history table
CREATE TABLE cost_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  total_cost DECIMAL(10, 2) NOT NULL,
  cost_by_service JSONB NOT NULL, -- {"EC2": 65.32, "RDS": 42.18}
  cost_by_region JSONB NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_history_user_month ON cost_history(user_id, month);

-- Recommendations table
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES aws_resources(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- 'right-sizing', 'reserved-instance', 'termination'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  action TEXT NOT NULL,
  current_cost DECIMAL(10, 2) NOT NULL,
  recommended_cost DECIMAL(10, 2) NOT NULL,
  savings DECIMAL(10, 2) NOT NULL,
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'applied', 'dismissed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);

-- Scan jobs table (for tracking background AWS scans)
CREATE TABLE scan_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  resources_found INT DEFAULT 0,
  errors TEXT[],
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scan_jobs_user_status ON scan_jobs(user_id, status);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- 'budget_exceeded', 'cost_spike', 'new_resource'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'critical'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_user_read ON alerts(user_id, is_read);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
