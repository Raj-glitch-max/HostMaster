# HostMaster: Production-Grade Cloud Cost Optimization Platform

![Status](https://img.shields.io/badge/status-in--development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![AWS](https://img.shields.io/badge/AWS-Infrastructure-orange)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green)

**HostMaster** is an enterprise-grade platform for AWS cost analysis, resource discovery, and cost optimization recommendations.

## 🎯 Project Goals

1. **Build Production-Ready Application** - Full-stack application deployed on AWS
2. **Enterprise CI/CD** - GitHub Actions pipeline with dev → stage → prod workflow
3. **Deep Learning** - Comprehensive documentation teaching every concept from zero to mastery
4. **Interview Readiness** - Knowledge and codebase worthy of senior DevOps/Cloud roles

## 🏗️ Architecture

```
Internet
   ↓
Application Load Balancer (Multi-AZ)
   ↓
Auto Scaling Group (EC2 instances)
   ├─ Backend API (Node.js/Express)
   ├─ Frontend Dashboard (Next.js)
   └─ PostgreSQL (RDS Multi-AZ)
```

**Key Features:**
- **4-Branch Workflow:** dev → stage → prod → main
- **Multi-AZ Deployment:** High availability across 2 availability zones
- **Infrastructure as Code:** Complete Terraform configuration
- **Automated CI/CD:** GitHub Actions for testing, security, deployment
- **Cost Optimized:** ~$150/month production infrastructure

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- AWS Account with IAM credentials
- Terraform 1.0+
- Docker (for local development)

### Local Development

```bash
# Clone repository
git clone https://github.com/Raj-glitch-max/HostMaster.git
cd HostMaster

# Backend
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Deploy to AWS

```bash
# Infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# Application deployment handled by GitHub Actions
```

## 📚 Documentation

This project includes **50+ comprehensive guides** teaching every technology from fundamentals to mastery:

### Fundamentals
- [Git Mastery](./doc/01-fundamentals/git-mastery.md) - Git from zero to enterprise workflows (60 min)
- [CI/CD Fundamentals](./doc/04-cicd/cicd-fundamentals.md) - Why CI/CD exists and how to master it (90 min)
- [Terraform Complete Guide](./doc/01-fundamentals/terraform-complete-guide.md) - Infrastructure as Code
- [AWS Fundamentals](./doc/01-fundamentals/aws-fundamentals.md) - Cloud computing foundation
- [DevOps Mindset](./doc/01-fundamentals/devops-mindset.md) - Thinking like a DevOps engineer

### Backend Development
- [Node.js Backend Mastery](./doc/02-backend/nodejs-backend-mastery.md)
- [API Design Principles](./doc/02-backend/api-design-principles.md)
- [Database Design](./doc/02-backend/database-design.md)
- [Authentication & Authorization](./doc/02-backend/authentication-authorization.md)

### Frontend Development
- [React & Next.js Mastery](./doc/03-frontend/react-nextjs-mastery.md)
- [UI/UX Principles](./doc/03-frontend/ui-ux-principles.md)
- [State Management](./doc/03-frontend/state-management.md)

### CI/CD Pipeline
- [GitHub Actions Architecture](./doc/04-cicd/github-actions-architecture.md)
- [Pipeline Design Principles](./doc/04-cicd/pipeline-design-principles.md)
- [Testing Strategies](./doc/04-cicd/testing-strategies.md)
- [Deployment Strategies](./doc/04-cicd/deployment-strategies.md)

### AWS Services (30+ Guides)
- **Compute:** [EC2](./doc/05-aws-services/01-compute/ec2-complete-guide.md), [Lambda](./doc/05-aws-services/01-compute/lambda-serverless.md), [ECS](./doc/05-aws-services/01-compute/ecs-containers.md)
- **Networking:** [VPC Deep Dive](./doc/05-aws-services/02-networking/vpc-deep-dive.md), [Route 53](./doc/05-aws-services/02-networking/route53-dns.md), [CloudFront](./doc/05-aws-services/02-networking/cloudfront-cdn.md)
- **Storage:** [S3](./doc/05-aws-services/03-storage/s3-complete-guide.md), [EBS/EFS](./doc/05-aws-services/03-storage/ebs-efs.md)
- **Database:** [RDS](./doc/05-aws-services/04-database/rds-deep-dive.md), [DynamoDB](./doc/05-aws-services/04-database/dynamodb-nosql.md), [ElastiCache](./doc/05-aws-services/04-database/elasticache.md)
- **Security:** [IAM](./doc/05-aws-services/05-security/iam-complete-guide.md), [Secrets Manager](./doc/05-aws-services/05-security/secrets-manager.md), [KMS](./doc/05-aws-services/05-security/kms-encryption.md)
- **Monitoring:** [CloudWatch](./doc/05-aws-services/06-monitoring/cloudwatch-complete.md), [CloudTrail](./doc/05-aws-services/06-monitoring/cloudtrail-audit.md), [X-Ray](./doc/05-aws-services/06-monitoring/x-ray-tracing.md)

### Interview Preparation
- [DevOps Interview Questions](./doc/07-interviews/devops-interview-questions.md) - 200+ questions with answers
- [AWS Interview Scenarios](./doc/07-interviews/aws-interview-scenarios.md) - Real-world problem solving
- [System Design Preparation](./doc/07-interviews/system-design-preparation.md)

**Documentation Philosophy:** Every guide teaches What, Why, How, When, Alternatives, Best Practices, and Interview Questions.

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js 20+ with Express
- **Database:** PostgreSQL 15 (RDS Multi-AZ)
- **Cache:** Redis (ElastiCache)
- **Auth:** JWT + AWS Cognito
- **Testing:** Jest, Supertest

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State:** React Context / Zustand
- **API Client:** Axios
- **Charts:** Recharts

### Infrastructure
- **Cloud:** AWS
- **IaC:** Terraform
- **CI/CD:** GitHub Actions
- **Containers:** Docker
- **Monitoring:** CloudWatch, X-Ray

## 🔄 Git Workflow

```
main (tagged releases v1.0.0, v1.1.0)
  │
  ├─ prod (production environment)
  │    │
  │    ├─ stage (staging/QA environment)
  │    │    │
  │    │    ├─ dev (development environment)
  │    │    │    │
  │    │    │    ├─ feature/cost-analysis
  │    │    │    ├─ feature/alert-system
  │    │    │    └─ fix/login-bug
```

**Workflow:**
1. Create feature branch from `dev`
2. PR to `dev` → CI runs (lint, unit tests) → Auto-deploy to dev environment
3. PR to `stage` → CI runs (integration tests, E2E tests, security scan) → Deploy to staging
4. PR to `prod` → CI runs (full test suite) → **Requires manual approval** → Deploy to production
5. Tag release on `main` for versioning

## 📈 CI/CD Pipeline

### Dev Branch
```yaml
Push to dev:
  - Lint (ESLint, Prettier)
  - Unit tests (< 5 min)
  - Build Docker image
  - Push to ECR
  - Deploy to dev environment
  - Smoke tests
```

### Stage Branch
```yaml
PR to stage:
  - All dev checks
  - Integration tests
  - E2E tests (Cypress)
  - Security scan (Snyk, SAST)
  - Deploy to staging 
  - Performance tests
```

### Prod Branch
```yaml
PR to prod (manual approval required):
  - All stage checks
  - Blue-green deployment
  - Canary release (10% → 100%)
  - Post-deployment monitoring
  - Automated rollback on errors
```

## 🔒 Security

- **IAM:** Least privilege policies, no hardcoded credentials
- **Secrets:** AWS Secrets Manager + GitHub Secrets
- **Network:** Private subnets, Security Groups, NACLs
- **Encryption:** KMS for data at rest, TLS for data in transit
- **Monitoring:** CloudWatch alarms, GuardDuty threat detection
- **WAF:** Web Application Firewall for API protection

## 💰 Cost Estimation

### Development Environment (~$50/month)
- 1x t3.small EC2
- RDS db.t3.micro
- 1x NAT Gateway
- Application Load Balancer

### Staging Environment (~$80/month)
- 2x t3.small EC2
- RDS db.t3.small
- 1x NAT Gateway
- ALB

### Production Environment (~$150/month)
- 2-5x t3.small EC2 (Auto Scaling)
- RDS db.t3.small Multi-AZ
- 2x NAT Gateway (Multi-AZ)
- ALB
- CloudFront CDN
- ElastiCache

**Optimization opportunities:**
- Reserved Instances (30% savings)
- NAT Gateway alternatives
- S3 lifecycle policies
- CloudFront caching

## 🎓 Learning Outcomes

After completing this project, you will be able to:

✅ Design and deploy production-grade AWS infrastructure  
✅ Build full-stack applications (Node.js backend + React frontend)  
✅ Implement enterprise CI/CD pipelines  
✅ Write Infrastructure as Code (Terraform)  
✅ Optimize AWS costs like a professional  
✅ Debug production issues using CloudWatch, X-Ray  
✅ Answer any DevOps/Cloud interview question  
✅ Pass system design interviews  
✅ Deploy applications with zero downtime  
✅ Implement security best practices  

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Contributing

This is a learning project. Feel free to fork and adapt for your own learning!

## 📧 Contact

- **GitHub:** [@Raj-glitch-max](https://github.com/Raj-glitch-max)
- **Project Link:** [github.com/Raj-glitch-max/HostMaster](https://github.com/Raj-glitch-max/HostMaster)

---

**Built with ❤️ as a journey from tutorial hell to production-grade engineering**
