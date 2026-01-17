# Monitoring & Observability

## Overview
Production-ready monitoring system with Prometheus metrics, health checks, and alerting.

## 🎯 What's Monitored

### Health Checks
- **Liveness**: `/health` - Basic uptime check
- **Readiness**: `/health/ready` - Database, Redis, Queue connectivity
- **Detailed**: `/health/detailed` - Full system status with metrics

### Prometheus Metrics (`/metrics`)

#### HTTP Metrics
- `http_requests_total` - Total HTTP requests (by method, route, status)
- `http_request_duration_seconds` - Request latency histogram

#### Business Metrics
- `aws_scans_total` - Total AWS scans (by status)
- `scan_job_duration_seconds` - Scan duration histogram
- `active_scans` - Currently running scans
- `total_aws_cost_dollars` - Total AWS cost tracked (by tier)
- `api_calls_total` - API usage (by endpoint, tier)

#### System Metrics (default)
- `nodejs_heap_size_total_bytes` - Node.js heap size
- `nodejs_heap_size_used_bytes` - Node.js heap used
- `nodejs_external_memory_bytes` - External memory
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `process_cpu_user_seconds_total` - CPU user time
- `process_cpu_system_seconds_total` - CPU system time

## Quick Start

### 1. Health Check Test
```bash
# Basic health
curl http://localhost:3000/health

# Response:
{
  "status": "healthy",
  "timestamp": "2026-01-17T03:20:00.000Z",
  "uptime": 1234.56,
  "version": "1.0.0"
}

# Readiness check (dependencies)
curl http://localhost:3000/health/ready

# Detailed system status
curl http://localhost:3000/health/detailed
```

### 2. Prometheus Metrics Test
```bash
curl http://localhost:3000/metrics

# Sample output:
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/v1/resources",status_code="200"} 42

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/v1/resources",status_code="200",le="0.1"} 35
http_request_duration_seconds_sum{method="GET",route="/api/v1/resources",status_code="200"} 2.45
http_request_duration_seconds_count{method="GET",route="/api/v1/resources",status_code="200"} 42

# HELP active_scans Number of currently active scan jobs
# TYPE active_scans gauge
active_scans 3
```

## Prometheus Setup

### 1. Install Prometheus (Local Development)
```bash
# macOS
brew install prometheus

# Linux
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

### 2. Configure Prometheus
Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'hostmaster-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'hostmaster-worker'
    static_configs:
      - targets: ['localhost:3001']  # If workers run separately
    metrics_path: '/metrics'

# Alerting rules
rule_files:
  - 'alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
```

### 3. Start Prometheus
```bash
./prometheus --config.file=prometheus.yml

# Access UI
open http://localhost:9090
```

### 4. Example Queries (PromQL)
```promql
# Request rate (req/sec)
rate(http_requests_total[5m])

# P95 request latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate (%)
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Active scans
active_scans

# Queue depth
queue_length{queue_name="scan",status="waiting"}
```

## Grafana Setup

### 1. Install Grafana
```bash
# macOS
brew install grafana

# Linux (Docker)
docker run -d -p 3001:3000 grafana/grafana-oss

# Access UI
open http://localhost:3001
# Login: admin / admin
```

### 2. Add Prometheus Data Source
1. Settings → Data Sources → Add data source
2. Select "Prometheus"
3. URL: `http://localhost:9090`
4. Click "Save & Test"

### 3. Import Dashboard
Use our pre-built dashboard JSON (see `monitoring/grafana-dashboard.json`):
1. Dashboards → Import → Upload JSON file
2. Select Prometheus data source
3. Click "Import"

### 4. Key Panels
- **Request Rate**: Requests per second
- **Latency P50/P95/P99**: Response time percentiles
- **Error Rate**: 5xx errors percentage
- **Active Scans**: AWS scans in progress
- **Queue Depth**: Bull queue length
- **CPU/Memory**: Node.js resource usage

## Alerting

### Prometheus Alert Rules
Create `alerts.yml`:
```yaml
groups:
  - name: hostmaster_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate ({{ $value | humanizePercentage }})"
          description: "API error rate is above 5% for 5 minutes"

      # High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency ({{ $value }}s)"
          description: "P95 latency is above 3 seconds"

      # Service down
      - alert: ServiceDown
        expr: up{job="hostmaster-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "HostMaster API is down"
          description: "API has been down for 1 minute"

      # Database connectivity
      - alert: DatabaseDown
        expr: |
          up{job="hostmaster-api"} == 1 and
          health_database_status{status="error"} == 1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connectivity lost"

      # High queue depth
      - alert: HighQueueDepth
        expr: queue_length{status="waiting"} > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High queue depth ({{ $value }} jobs)"
          description: "More than 100 jobs waiting for 10 minutes"

      # Many failed scans
      - alert: HighFailureRate
        expr: queue_length{status="failed"} > 50
        for: 5m
        labels:
          severity: warning
          annotations:
          summary: "Many failed scan jobs ({{ $value }})"
```

### Alertmanager Configuration
Create `alertmanager.yml`:
```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 3h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        title: '🚨 {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'slack'
    slack_configs:
      - channel: '#monitoring'
        title: '⚠️  {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: YOUR_PAGERDUTY_KEY
```

## Production Deployment

### Kubernetes
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hostmaster-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: hostmaster-api:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5

---
# ServiceMonitor for Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: hostmaster-api
spec:
  selector:
    matchLabels:
      app: hostmaster-api
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
```

### Docker Compose with Monitoring Stack
```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/alerts.yml:/etc/prometheus/alerts.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana-oss:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana-datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml
      - ./monitoring/grafana-dashboard.json:/etc/grafana/provisioning/dashboards/hostmaster.json

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

## SaaS Monitoring Options

### 1. Datadog
```bash
# Install agent
DD_API_KEY=<YOUR_KEY> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Add to .env
export DD_API_KEY=your_datadog_api_key
export DD_SERVICE=hostmaster-api
export DD_ENV=production

# Install Datadog APM
npm install dd-trace
```

```javascript
// Add to server.js (FIRST LINE)
require('dd-trace').init({
  service: 'hostmaster-api',
  env: process.env.NODE_ENV
});
```

Cost: $15/host/month (Pro plan)

### 2. New Relic
```bash
# Install agent
npm install newrelic

# Configure newrelic.js
```

Cost: Free tier → $25/user/month

### 3. Sentry (Error Tracking)
```bash
npm install @sentry/node
```

```javascript
// Already configured in src/config/sentry.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

Cost: Free tier → $26/month (Team)

## Custom Dashboards

### Metrics to Track

#### Golden Signals (SRE)
1. **Latency**: Request duration (P50, P95, P99)
2. **Traffic**: Requests per second
3. **Errors**: Error rate (%)
4. **Saturation**: Queue depth, CPU, memory

#### Business Metrics
- AWS scans per day
- Active users
- Total AWS cost monitored
- API calls by tier
- Conversion rate (free → paid)

## Testing Monitoring

### Load Test
```bash
# Install artillery
npm install -g artillery

# Create loadtest.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - flow:
    - get:
        url: "/health"
    - get:
        url: "/api/v1/resources"
        headers:
          Authorization: "Bearer YOUR_TOKEN"

# Run load test
artillery run loadtest.yml

# Watch metrics in Grafana
```

### Simulate Failures
```bash
# Stop database
docker stop hostmaster-postgres

# Check /health/ready → should return 503
curl http://localhost:3000/health/ready

# Alert should fire within 2 minutes
```

## Production Checklist

- [ ] Health endpoints working (`/health`, `/health/ready`, `/health/detailed`)
- [ ] Metrics endpoint working (`/metrics`)
- [ ] Prometheus scraping successfully
- [ ] Grafana dashboard created
- [ ] Alert rules configured
- [ ] Alertmanager configured (Slack/PagerDuty)
- [ ] Kubernetes probes configured (if using K8s)
- [ ] SaaS monitoring integrated (Datadog/New Relic)
- [ ] Error tracking enabled (Sentry)
- [ ] On-call rotation defined
- [ ] Runbook created for common alerts
- [ ] Load testing completed
- [ ] Failure scenarios tested

## Costs

### Self-Hosted (Prometheus + Grafana)
- **EC2 t3.small**: $15-20/month
- **EBS storage**: $5/month (50GB)
- **Total**: ~$25/month

### SaaS
- **Datadog**: $15/host/month
- **New Relic**: $25/user/month
- **Sentry**: $26/team/month
- **Total**: ~$66/month (all 3)

### Recommendation
- Start: Self-hosted Prometheus + Grafana + free Sentry
- Scale: Add Datadog when revenue > $10K/month

## Next Steps
1. Deploy Prometheus and Grafana
2. Import dashboard
3. Configure alerts
4. Test with load
5. Set up on-call rotation
