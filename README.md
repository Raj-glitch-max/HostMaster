# HostMaster 🚀

> **AWS Cost Optimization Platform** - Learning project demonstrating full-stack development with AWS integration.

A development-stage SaaS platform that analyzes AWS resources and provides cost-saving recommendations. Built to demonstrate full-stack development, DevOps practices, and cloud infrastructure skills.

[![Development Stage](https://img.shields.io/badge/status-development-yellow.svg)](https://github.com/Raj-glitch-max/HostMaster)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## 🎯 Project Overview

HostMaster is a learning project built to master:
- Full-stack development (Next.js + Node.js)
- AWS API integration (EC2, RDS, Cost Explorer)
- Background job processing (Bull + Redis)
- DevOps practices (Docker, CI/CD)
- Database design & optimization
- Security best practices

## ✅ What Actually Works

### Core Features (Functional)
- ✅ **User Authentication** - JWT-based registration and login
- ✅ **AWS Resource Scanning** - Fetches EC2 and RDS instances via AWS SDK
- ✅ **Cost Tracking** - Stores and displays historical cost data
- ✅ **Recommendations Engine** - Rule-based cost optimization suggestions
- ✅ **Alert System** - Budget threshold monitoring with database alerts
- ✅ **Dashboard UI** - Real-time cost visualizations and charts
- ✅ **Background Workers** - Bull queue for async AWS scanning

### What's Implemented (But Needs Testing)
- ⚠️ **Background job processing** - Configured but not stress-tested
- ⚠️ **Email/Slack alerts** - Code exists but requires API keys
- ⚠️ **Report generation** - PDF creation implemented

### What's NOT Implemented
- ❌ **Production deployment** - Terraform config exists but not deployed
- ❌ **Prometheus/Grafana** - Metrics endpoint exists, no visualization
- ❌ **Sentry error tracking** - Package installed, not configured
- ❌ **Comprehensive testing** - Basic Jest setup, minimal coverage
- ❌ **SMS alerts** - Placeholder only

---

## 🛠 Technology Stack

**Frontend:**
- Next.js 14 (TypeScript)
- TailwindCSS
- Recharts for visualizations

**Backend:**
- Node.js 20 + Express.js
- PostgreSQL 15 (primary database)
- Redis 7 (queue + cache)
- Bull (background jobs)

**AWS Integration:**
- AWS SDK v2 (EC2, RDS, Cost Explorer APIs)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD configured)
- Terraform (IaC configuration)
- PM2 (process management)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- AWS account with API credentials (for scanning)

### 1. Clone Repository
```bash
git clone https://github.com/Raj-glitch-max/HostMaster.git
cd HostMaster
```

### 2. Environment Setup
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Start Services
```bash
# Start database and cache
docker-compose up -d postgres redis

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
cd frontend && npm run dev
```

### 4. Access Application
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health

### 5. Demo Login
For testing with seed data:
- Email: `demo@hostmaster.io`
- Password: `password`

---

## 📊 Database Schema

Key tables:
- `users` - User accounts with encrypted AWS credentials
- `aws_resources` - Discovered EC2/RDS instances
- `cost_history` - Monthly cost tracking by service
- `recommendations` - Generated cost-saving suggestions
- `scan_jobs` - Background scan job tracking
- `alerts` - Budget and resource alerts

See `backend/database/schema.sql` for details.

---

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/login` - Get JWT token

### Resources
- `GET /api/v1/resources` - List all AWS resources
- `POST /api/v1/resources/scan` - Trigger AWS scan

### Costs
- `GET /api/v1/costs` - Get cost data and forecasts

### Recommendations
- `GET /api/v1/recommendations` - Get cost-saving suggestions
- `PATCH /api/v1/recommendations/:id/dismiss` - Dismiss recommendation

### Alerts
- `GET /api/v1/alerts` - Get user alerts
- `PATCH /api/v1/alerts/:id/read` - Mark alert as read
- `DELETE /api/v1/alerts/:id` - Delete alert

---

## 🏗 Architecture

```
┌─────────────┐
│  Next.js    │ ← Frontend (port 3001)
│  Dashboard  │
└──────┬──────┘
       │ REST API
┌──────▼──────┐
│  Express.js │ ← Backend API (port 3000)
│  API Server │
└──┬────┬─────┘
   │    │
   │    └─────────┐
   │              │
┌──▼───┐    ┌────▼────┐
│ Bull │    │  AWS    │
│Queue │    │   SDK   │
└──────┘    └─────────┘
   │
┌──▼──┐
│Redis│
└─────┘
   │
┌──▼────────┐
│PostgreSQL │
└───────────┘
```

---

## 🔐 Security Features

- JWT authentication with 7-day expiry
- Bcrypt password hashing (12 rounds)
- AES-256 encryption for AWS credentials
- Parameterized SQL queries (injection prevention)
- Helmet.js security headers
- CORS configuration
- Rate limiting (basic implementation)

---

## 🧪 Development Status

**Completion: ~60%**

**Working:**
- Core CRUD operations
- AWS API integration (EC2, RDS, Cost Explorer)
- Background job processing
- User authentication
- Dashboard with real data

**In Progress:**
- Comprehensive testing
- Production deployment
- Monitoring setup

**Planned:**
- S3 and Lambda scanning
- Advanced recommendations with CloudWatch metrics
- Multi-account support
- Cost forecasting improvements

---

## 📝 Testing

```bash
cd backend
npm test
```

Note: Test coverage is currently minimal. Expanding test suite is a priority.

---

## 🎓 Learning Outcomes

This project taught me:
- **AWS SDK integration** - EC2, RDS, Cost Explorer APIs
- **Background job processing** - Bull queues, Redis
- **Full-stack architecture** - Separation of concerns, API design
- **Database design** - PostgreSQL schema with JSONB
- **DevOps practices** - Docker containerization, CI/CD
- **Security fundamentals** - Encryption, authentication
- **TypeScript** - Type-safe frontend development

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built as a learning project to demonstrate full-stack + DevOps skills
- Inspired by enterprise AWS cost management tools
- Not affiliated with AWS

---

## 📧 Contact

For questions or feedback about this project:
- GitHub: [@Raj-glitch-max](https://github.com/Raj-glitch-max)
- Project: [HostMaster](https://github.com/Raj-glitch-max/HostMaster)
