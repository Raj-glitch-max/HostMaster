-- HostMaster Seed Data
-- Realistic demo data for testing and screenshots

-- Clear existing data (for re-seeding)
TRUNCATE TABLE alerts, recommendations, scan_jobs, cost_history, aws_resources, users RESTART IDENTITY CASCADE;

-- Insert 3 demo users with different tiers
INSERT INTO users (id, email, password_hash, name, tier, budget, alert_email, alert_slack, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'demo@hostmaster.io', '$2b$10$rKvFLYvOy9j3r3GZ3R3Zf.1QZ3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3e', 'Demo User', 'professional', 2000.00, TRUE, FALSE, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440002', 'startup@hostmaster.io', '$2b$10$rKvFLYvOy9j3r3GZ3R3Zf.1QZ3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3e', 'Startup Team', 'free', 500.00, TRUE, FALSE, NOW() - INTERVAL '60 days'),
('550e8400-e29b-41d4-a716-446655440003', 'enterprise@hostmaster.io', '$2b$10$rKvFLYvOy9j3r3GZ3R3Zf.1QZ3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3e', 'Enterprise Corp', 'enterprise', 10000.00, TRUE, TRUE, NOW() - INTERVAL '90 days');

-- Password for all users: "Password123!" (hashed with bcrypt)

-- Insert EC2 instances for demo user
INSERT INTO aws_resources (id, user_id, resource_type, resource_id, resource_name, region, instance_type, state, monthly_cost, metadata, discovered_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'ec2', 'i-0123456789abcdef0', 'web-server-prod', 'us-east-1', 't3.large', 'running', 62.00, '{"platform":"Linux","vCPUs":2,"memory":"8 GiB","storage":"EBS Only"}', NOW() - INTERVAL '7 days'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'ec2', 'i-0123456789abcdef1', 'api-server-prod', 'us-east-1', 't3.medium', 'running', 31.00, '{"platform":"Linux","vCPUs":2,"memory":"4 GiB","storage":"EBS Only"}', NOW() - INTERVAL '7 days'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'ec2', 'i-0123456789abcdef2', 'worker-server', 'us-west-2', 't3.small', 'running', 15.50, '{"platform":"Linux","vCPUs":2,"memory":"2 GiB","storage":"EBS Only"}', NOW() - INTERVAL '7 days'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'ec2', 'i-0123456789abcdef3', 'dev-server', 'us-east-1', 't3.micro', 'stopped', 7.50, '{"platform":"Linux","vCPUs":2,"memory":"1 GiB","storage":"EBS Only"}', NOW() - INTERVAL '7 days'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'ec2', 'i-0123456789abcdef4', 'test-server', 'eu-west-1', 't3.medium', 'stopped', 30.00, '{"platform":"Linux","vCPUs":2,"memory":"4 GiB","storage":"EBS Only"}', NOW() - INTERVAL '7 days');

-- Insert RDS instances
INSERT INTO aws_resources (id, user_id, resource_type, resource_id, resource_name, region, instance_type, state, monthly_cost, metadata, discovered_at) VALUES
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'rds', 'db-ABCD1234EFGH5678', 'production-db', 'us-east-1', 'db.t3.medium', 'available', 120.00, '{"engine":"postgres","version":"15.3","storage":"100 GB","multiAZ":true}', NOW() - INTERVAL '7 days'),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'rds', 'db-IJKL9012MNOP3456', 'staging-db', 'us-west-2', 'db.t3.small', 'available', 65.00, '{"engine":"postgres","version":"15.3","storage":"50 GB","multiAZ":false}', NOW() - INTERVAL '7 days'),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 'rds', 'db-QRST5678UVWX1234', 'analytics-db', 'us-east-1', 'db.m5.large', 'available', 280.00, '{"engine":"postgresql","version":"14.7","storage":"250 GB","multiAZ":true}', NOW() - INTERVAL '7 days');

-- Insert cost history (last 3 months)
INSERT INTO cost_history (user_id, month, total_cost, cost_by_service, cost_by_region, recorded_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '2025-10', 1520.50, '{"EC2": 425.30, "RDS": 680.20, "S3": 85.00, "Lambda": 130.00, "CloudFront": 200.00}', '{"us-east-1": 980.50, "us-west-2": 340.00, "eu-west-1": 200.00}', NOW() - INTERVAL '90 days'),
('550e8400-e29b-41d4-a716-446655440001', '2025-11', 1780.75, '{"EC2": 480.50, "RDS": 720.25, "S3": 95.00, "Lambda": 185.00, "CloudFront": 300.00}', '{"us-east-1": 1120.75, "us-west-2": 410.00, "eu-west-1": 250.00}', NOW() - INTERVAL '60 days'),
('550e8400-e29b-41d4-a716-446655440001', '2025-12', 2145.30, '{"EC2": 520.30, "RDS": 780.00, "S3": 115.00, "Lambda": 230.00, "CloudFront": 500.00}', '{"us-east-1": 1345.30, "us-west-2": 480.00, "eu-west-1": 320.00}', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440001', '2026-01', 2380.45, '{"EC2": 611.00, "RDS": 465.00, "S3": 125.00, "Lambda": 279.45, "CloudFront": 900.00}', '{"us-east-1": 1480.45, "us-west-2": 530.00, "eu-west-1": 370.00}', NOW());

-- Insert realistic recommendations
INSERT INTO recommendations (id, user_id, resource_id, type, title, description, action, current_cost, recommended_cost, savings, confidence_score, status, created_at) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'right-sizing', 'Downsize web-server-prod Instance', 'Instance web-server-prod (t3.large) has averaged only 15% CPU utilization over the past 14 days. Consider downsizing to t3.medium to reduce costs.', 'Downgrade from t3.large to t3.medium', 62.00, 31.00, 31.00, 0.88, 'pending', NOW() - INTERVAL '3 days'),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440006', 'reserved-instance', 'Purchase Reserved Instance for production-db', 'Database production-db runs 24/7 with consistent usage. Purchasing a 1-year Reserved Instance would save 40% on compute costs.', 'Purchase 1-year RI for db.t3.medium (PostgreSQL)', 120.00, 72.00, 48.00, 0.92, 'pending', NOW() - INTERVAL '5 days'),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440004', 'termination', 'Terminate Stopped dev-server Instance', 'Instance dev-server has been stopped for 45 days but still incurs EBS storage costs of $7.50/month. Consider terminating if no longer needed.', 'Terminate instance i-0123456789abcdef3 and associated resources', 7.50, 0.00, 7.50, 0.75, 'pending', NOW() - INTERVAL '2 days'),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', 'termination', 'Terminate Stopped test-server Instance', 'Instance test-server in EU has been stopped for 32 days. Still incurring storage costs of $30/month.', 'Terminate instance i-0123456789abcdef4 and cleanup EBS volumes', 30.00, 0.00, 30.00, 0.72, 'pending', NOW() - INTERVAL '1 day'),
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440008', 'right-sizing', 'Downsize analytics-db Database', 'RDS instance analytics-db shows low connection count and CPU usage. Consider downgrading from db.m5.large to db.m5.medium.', 'Downgrade from db.m5.large to db.m5.medium', 280.00, 140.00, 140.00, 0.80, 'pending', NOW() - INTERVAL '4 days'),
('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'reserved-instance', 'Purchase Reserved Instance for api-server-prod', 'API server runs continuously. 1-year RI would save $148/year.', 'Purchase 1-year RI for t3.medium', 31.00, 18.60, 12.40, 0.90, 'pending', NOW() - INTERVAL '6 days');

-- Insert scan jobs
INSERT INTO scan_jobs (id, user_id, status, resources_found, started_at, completed_at, created_at) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'completed', 8, NOW() - INTERVAL '7 days 2 hours', NOW() - INTERVAL '7 days 1 hour 58 minutes', NOW() - INTERVAL '7 days 2 hours'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'completed', 8, NOW() - INTERVAL '3 days 5 hours', NOW() - INTERVAL '3 days 4 hours 57 minutes', NOW() - INTERVAL '3 days 5 hours'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'failed', 0, NOW() - INTERVAL '1 day 3 hours', NOW() - INTERVAL '1 day 2 hours 55 minutes', NOW() - INTERVAL '1 day 3 hours'),
('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'completed', 8, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 58 minutes', NOW() - INTERVAL '6 hours');

-- Insert alerts (budget warnings and expensive resources)
INSERT INTO alerts (id, user_id, type, title, message, severity, is_read, created_at) VALUES
('950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'budget_exceeded', '⚠️ WARNING: Monthly Budget Exceeded', 'Your current AWS spending of $2,380.45 is 19% over your monthly budget of $2,000.00. Consider reviewing your recommendations to reduce costs.', 'warning', FALSE, NOW() - INTERVAL '2 hours'),
('950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'expensive_resource', '💸 Expensive Resource Detected', 'Resource analytics-db (RDS db.m5.large) costs $280.00/month. Review HostMaster recommendations for potential savings.', 'warning', FALSE, NOW() - INTERVAL '4 hours'),
('950e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'new_resource', '🆕 New Resource Discovered', 'HostMaster detected 8 AWS resources in your account during the latest scan.', 'info', TRUE, NOW() - INTERVAL '6 hours'),
('950e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'cost_spike', '📈 Cost Spike Detected', 'Your CloudFront costs increased by 80% this month ($500 vs last month''s $300). Investigate CDN usage patterns.', 'warning', FALSE, NOW() - INTERVAL '1 day'),
('950e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'scan_completed', 'Scan Completed Successfully', 'AWS account scan completed successfully. Found 8 resources across 3 regions.', 'info', TRUE, NOW() - INTERVAL '6 hours 5 minutes');

-- Verify seed data
SELECT 'Users created: ' || COUNT(*) FROM users;
SELECT 'Resources created: ' || COUNT(*) FROM aws_resources;
SELECT 'Cost history records: ' || COUNT(*) FROM cost_history;
SELECT 'Recommendations created: ' || COUNT(*) FROM recommendations;
SELECT 'Scan jobs created: ' || COUNT(*) FROM scan_jobs;
SELECT 'Alerts created: ' || COUNT(*) FROM alerts;
