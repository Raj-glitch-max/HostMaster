# GitHub Actions - Part 3: Enterprise CI/CD Patterns for HostMaster

> **Learning Goal:** Design production-grade CI/CD pipelines with multi-environment deployment

---

## 🏢 Enterprise Branch Strategy

### The 4-Branch Model (HostMaster Uses This)

```
main (production)
  ├─ stage (pre-production testing)
  │   ├─ dev (active development)
  │   │   └─ feature/* (individual features)
```

**Branch Purpose:**

| Branch | Purpose | Who Deploys | Deploy Trigger |
|--------|---------|-------------|----------------|
| `feature/*` | New feature work | Never (local only) | N/A |
| `dev` | Integration testing | Auto-deploy to dev env | Every push |
| `stage` | Pre-production testing | Auto-deploy to staging | PR merge to stage |
| `main` | Production (users) | Manual approval | PR merge + approval |

**Workflow:**

```
1. Developer creates feature/user-auth branch
2. Works locally, commits frequently
3. Opens PR: feature/user-auth → dev
4. CI runs: lint, test, build
5. If pass → Merge to dev → Auto-deploy to dev env
6. Test on dev environment
7. Open PR: dev → stage
8. CI runs: all dev checks + E2E tests + security scan
9. If pass → Merge to stage → Auto-deploy to staging
10. QA team tests on staging
11. Open PR: stage → main
12. CI runs: all checks + manual approval required
13. After approval → Merge to main → Deploy to production
```

---

## 🎯 HostMaster CI/CD Architecture

We'll create 3 workflow files:

### 1. **dev-ci.yml** - Development Pipeline
- Triggers: Push to `dev` branch
- Jobs: Lint → Test → Build → Deploy to Dev

### 2. **stage-ci.yml** - Staging Pipeline
- Triggers: PR to `stage` branch
- Jobs: Lint → Test → Build → E2E Tests → Deploy to Staging

### 3. **prod-ci.yml** - Production Pipeline
- Triggers: PR to `main` branch (with approval)
- Jobs: All checks → Security Scan → Deploy to Production → Monitor

---

## 📝 dev-ci.yml - Development Pipeline

**File:** `.github/workflows/dev-ci.yml`

```yaml
name: Dev CI/CD Pipeline

on:
  push:
    branches: [dev]
  pull_request:
    branches: [dev]

# Cancel previous runs if new push
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Job 1: Lint Code
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run ESLint
        working-directory: ./backend
        run: npm run lint
      
      - name: Check code formatting
        working-directory: ./backend
        run: npm run format:check

  # Job 2: Run Tests
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint  # Only run if lint passes
    
    # Service containers (PostgreSQL, Redis)
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: hostmaster_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run database migrations
        working-directory: ./backend
        run: npm run migrate
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: hostmaster_test
          DB_USER: postgres
          DB_PASSWORD: test_password
      
      - name: Run unit tests
        working-directory: ./backend
        run: npm test -- --coverage
        env:
          DB_HOST: localhost
          REDIS_HOST: localhost
          JWT_SECRET: test_secret
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
          fail_ci_if_error: false

  # Job 3: Build Docker Image
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: test  # Only build if tests pass
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/hostmaster-backend:dev
            ${{ secrets.DOCKER_USERNAME }}/hostmaster-backend:dev-${{ github.sha }}
          cache-from: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/hostmaster-backend:dev
          cache-to: type=inline
      
      - name: Build and push frontend image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/hostmaster-frontend:dev
            ${{ secrets.DOCKER_USERNAME }}/hostmaster-frontend:dev-${{ github.sha }}

  # Job 4: Deploy to Dev Environment
  deploy-dev:
    name: Deploy to Dev
    runs-on: ubuntu-latest
    needs: build
    environment: development  # GitHub environment for approvals/secrets
    
    steps:
      - name: Deploy to AWS ECS (Dev)
        run: |
          # Update ECS task definition with new image
          aws ecs update-service \
            --cluster hostmaster-dev \
            --service hostmaster-backend \
            --force-new-deployment
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster hostmaster-dev \
            --services hostmaster-backend
      
      - name: Run smoke tests
        run: |
          curl -f https://dev.hostmaster.io/health || exit 1
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Dev deployment successful!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Dev Deployment Complete*\n\nCommit: `${{ github.sha }}`\nAuthor: ${{ github.actor }}\nEnvironment: Development"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🔍 Breaking Down Key Concepts

### 1. **Concurrency Control**

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Why?**
- If you push 3 commits quickly, 3 workflows start
- Old workflows are outdated (you've pushed newer code)
- Cancel old ones, only run latest

### 2. **Job Dependencies**

```yaml
jobs:
  lint:
    # runs first
  
  test:
    needs: lint  # Wait for lint to finish
  
  build:
    needs: test  # Wait for test to finish
```

**Flow:**
```
lint → test → build → deploy
  ↓     ↓       ↓       ↓
 pass  pass   pass   pass
```

If ANY step fails, pipeline stops.

### 3. **Service Containers**

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: test_password
    ports:
      - 5432:5432
```

**Why?**
- Tests need database
- Instead of mocking, use REAL Postgres
- Each workflow run gets fresh database
- Tests run in isolation

### 4. **GitHub Environments**

```yaml
environment: development
```

**What it does:**
- Groups secrets by environment
- Enables deployment protection rules
- Tracks deployment history
- Allows manual approvals

**Setup:**
1. GitHub Repo → Settings → Environments
2. Create "development", "staging", "production"
3. Add secrets to each environment
4. Set protection rules (e.g., "production" requires approval)

### 5. **Docker Layer Caching**

```yaml
cache-from: type=registry,ref=user/image:dev
cache-to: type=inline
```

**Why?**
- Docker builds layers (base image → dependencies → code)
- If dependencies don't change, reuse cached layer
- Speeds up build from 5min → 30sec

---

## 🎯 stage-ci.yml - Staging Pipeline

**File:** `.github/workflows/stage-ci.yml`

```yaml
name: Stage CI/CD Pipeline

on:
  pull_request:
    branches: [stage]
  push:
    branches: [stage]

jobs:
  # Reuse dev jobs
  lint:
    # ... (same as dev-ci.yml)
  
  test:
    # ... (same as dev-ci.yml)
  
  build:
    # ... (same as dev-ci.yml but tag as 'stage')
  
  # ADDITIONAL: End-to-End Tests
  e2e-tests:
    name: Run E2E Tests
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Playwright
        working-directory: ./frontend
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        working-directory: ./frontend
        run: npm run test:e2e
        env:
          BASE_URL: https://stage.hostmaster.io
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
  
  # ADDITIONAL: Security Scan
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run npm audit
        working-directory: ./backend
        run: npm audit --production
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run SAST (Static Analysis)
        uses: github/codeql-action/analyze@v2
  
  # Deploy to Staging
  deploy-stage:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [e2e-tests, security-scan]
    environment: staging
    
    steps:
      - name: Deploy to AWS ECS (Staging)
        run: |
          aws ecs update-service \
            --cluster hostmaster-stage \
            --service hostmaster-backend \
            --force-new-deployment
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID_STAGE }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGE }}
      
      - name: Run smoke tests
        run: |
          curl -f https://stage.hostmaster.io/health || exit 1
          curl -f https://stage.hostmaster.io/api/v1/resources || exit 1
      
      - name: Notify QA team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🎭 New staging deployment ready for testing!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Staging Deployment*\n\n<https://stage.hostmaster.io|Test Environment>\n\nReady for QA testing."
                  }
                }
              ]
            }
```

---

## 🚀 prod-ci.yml - Production Pipeline

**File:** `.github/workflows/prod-ci.yml`

```yaml
name: Production CI/CD Pipeline

on:
  pull_request:
    branches: [main]
    types: [opened, syn

chronized, reopened]

jobs:
  # All previous checks
  lint:
    # ... (same as stage)
  
  test:
    # ... (same as stage)
  
  security-scan:
    # ... (same as stage)
  
  e2e-tests:
    # ... (same as stage)
  
  # PRODUCTION ONLY: Load Testing
  load-test:
    name: Load Testing
    runs-on: ubuntu-latest
    needs: [test, e2e-tests]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: tests/load/api-load-test.js
          cloud: true
          token: ${{ secrets.K6_CLOUD_TOKEN }}
      
      - name: Check performance thresholds
        run: |
          # Fail if p95 latency > 500ms
          # Fail if error rate > 1%
  
  # Build production image
  build-prod:
    name: Build Production Image
    runs-on: ubuntu-latest
    needs: [test, security-scan, e2e-tests, load-test]
    
    steps:
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/hostmaster-backend:latest
            ${{ secrets.DOCKER_USERNAME }}/hostmaster-backend:${{ github.sha }}
            ${{ secrets.DOCKER_USERNAME }}/hostmaster-backend:v1.${{ github.run_number }}
  
  # Deploy to Production (Manual Approval Required)
  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-prod
    environment:
      name: production
      url: https://hostmaster.io
    
    steps:
      - name: Deploy to AWS ECS (Production)
        run: |
          # Blue-Green deployment
          aws ecs update-service \
            --cluster hostmaster-prod \
            --service hostmaster-backend \
            --force-new-deployment \
            --deployment-configuration "minimumHealthyPercent=100,maximumPercent=200"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
      
      - name: Wait for healthy deployment
        run: |
          aws ecs wait services-stable \
            --cluster hostmaster-prod \
            --services hostmaster-backend
      
      - name: Run production smoke tests
        run: |
          curl -f https://hostmaster.io/health || exit 1
      
      - name: Monitor error rate (5 minutes)
        run: |
          # Check CloudWatch metrics
          # If error rate > 2%, rollback
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v1.${{ github.run_number }}
          release_name: Release v1.${{ github.run_number }}
          body: |
            ## Changes
            ${{ github.event.pull_request.body }}
      
      - name: Notify success
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Production deployment successful!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment*\n\nVersion: v1.${{ github.run_number }}\nDeployed by: ${{ github.actor }}"
                  }
                }
              ]
            }
```

---

## 🎓 Interview Questions

### Q1: "How do you handle secrets in CI/CD?"

**Answer:**
"Store secrets in GitHub repository settings (Settings → Secrets → Actions), not in code. Reference them in workflows as `${{ secrets.SECRET_NAME }}`. They're encrypted at rest and masked in logs. For different environments (dev/stage/prod), use GitHub Environments to scope secrets. Never commit `.env` files or hardcode credentials."

### Q2: "Explain blue-green deployment"

**Answer:**
"Blue-green deployment maintains two identical environments: 'blue' (current production) and 'green' (new version). Deploy to green, run health checks, then switch traffic from blue to green. If issues arise, switch back to blue instantly. This enables zero-downtime deployments and instant rollbacks. In AWS ECS, set `minimumHealthyPercent=100, maximumPercent=200` to achieve this."

### Q3: "How do you ensure code quality before production?"

**Answer:**
"Multi-stage pipeline with increasing rigor:
1. Dev: Lint + unit tests (fast feedback)
2. Stage: All dev checks + E2E tests + security scan
3. Prod: All stage checks + load testing + manual approval

Each stage must pass before promotion. Failed checks block deployment completely."

---

## 🛡️ Branch Protection Rules

Configure in GitHub: **Settings → Branches → Branch protection rules**

### For `main` (Production):
```
✅ Require pull request reviews (2 approvals)
✅ Require status checks to pass:
   - lint
   - test
   - security-scan
   - e2e-tests
   - load-test
✅ Require branches to be up to date
✅ Require signed commits
✅ Include administrators (no bypass)
✅ Restrict who can push (only CI/CD)
```

### For `stage`:
```
✅ Require pull request reviews (1 approval)
✅ Require status checks:
   - lint
   - test
   - e2e-tests
```

### For `dev`:
```
✅ Require status checks:
   - lint
   - test
```

---

## 📈 Monitoring Deployments

After deployment, monitor these metrics:

```yaml
- name: Monitor post-deployment
  run: |
    # Wait 5 minutes, check CloudWatch
    sleep 300
    
    ERROR_RATE=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/ApplicationELB \
      --metric-name HTTPCode_Target_5XX_Count \
      --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
      --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
      --period 300 \
      --statistics Sum)
    
    if [ "$ERROR_RATE" -gt 10 ]; then
      echo "Error rate too high, rolling back"
      aws ecs update-service --cluster prod --service app --task-definition previous
      exit 1
    fi
```

---

## 🎯 Next: Part 4 - Rollback & Disaster Recovery

In Part 4, we'll cover:
- Automatic rollback strategies
- Database migration rollbacks
- Disaster recovery procedures
- Incident response playbooks

**This completes enterprise CI/CD patterns! You now know how to:**
- ✅ Design 4-branch workflow (feature → dev → stage → main)
- ✅ Build multi-stage pipelines
- ✅ Implement environment-specific deployments
- ✅ Add security scanning
- ✅ Configure branch protection
- ✅ Monitor deployments

**Ready to build HostMaster's actual CI/CD? Let's implement it!**
