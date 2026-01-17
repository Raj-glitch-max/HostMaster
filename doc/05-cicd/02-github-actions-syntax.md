# GitHub Actions - Part 2: YAML Syntax & Your First Workflow

> **Learning Goal:** Write and understand GitHub Actions workflow files from scratch

---

## 📝 YAML Basics (5 Minutes)

GitHub Actions uses YAML files. Before we write workflows, understand YAML syntax:

### What is YAML?
YAML = **Y**AML **A**in't **M**arkup **L**anguage (recursive acronym, programmers love these 😄)

It's a way to write configuration files that humans can easily read.

### Basic YAML Syntax:

```yaml
# Comments start with #

# Key-value pairs (like JSON objects)
name: HostMaster
version: 1.0

# Nested objects (use indentation, NOT tabs!)
database:
  host: localhost
  port: 5432
  name: hostmaster_dev

# Lists (use dashes)
fruits:
  - apple
  - banana
  - orange

# Or inline:
colors: [red, green, blue]

# Multiline strings (use |)
description: |
  This is a long description
  that spans multiple lines
  and preserves line breaks
```

**CRITICAL RULES:**
1. **Indentation MATTERS** - Use 2 spaces (NOT tabs!)
2. **Colons need space** - `key: value` not `key:value`
3. **Dashes for lists** - Each item gets a `-`

---

## 🏗️ GitHub Actions Workflow Structure

Every workflow file has this structure:

```yaml
name: <workflow-name>        # Human-readable name
on: <triggers>               # When to run
jobs:                        # What to do
  <job-name>:
    runs-on: <runner>        # Which OS
    steps:                    # Actual commands
      - name: <step-name>
        run: <command>
```

Let's build this step-by-step:

---

## 🎯 Your First Workflow: Hello World

### Step 1: Create the file

```bash
mkdir -p .github/workflows
touch .github/workflows/hello.yml
```

**Why this path?**
- `.github/` - GitHub looks here for config
- `workflows/` - Workflows go in this folder
- `hello.yml` - Can be any name

### Step 2: Define workflow name

```yaml
name: Hello World CI
```

This appears in GitHub UI. Make it descriptive.

### Step 3: Define trigger

```yaml
on: push
```

This means: "Run this workflow every time someone pushes to ANY branch"

**Other triggers:**
```yaml
# On push to specific branch
on:
  push:
    branches:
      - main
      - dev

# On pull request
on: pull_request

# On schedule (cron)
on:
  schedule:
    - cron: '0 0 * * *'  # Every day at midnight

# Manual trigger
on: workflow_dispatch

# Multiple triggers
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
```

### Step 4: Define jobs

```yaml
jobs:
  greet:  # Job ID (can be anything)
    runs-on: ubuntu-latest  # Use Ubuntu Linux
```

**Available runners:**
- `ubuntu-latest` - Ubuntu Linux (most common)
- `macos-latest` - macOS
- `windows-latest` - Windows
- `ubuntu-20.04` - Specific version

### Step 5: Define steps

```yaml
    steps:
      - name: Say hello
        run: echo "Hello, GitHub Actions!"
      
      - name: Show date
        run: date
      
      - name: List files
        run: ls -la
```

**Complete file:**
```yaml
name: Hello World CI

on: push

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        run: echo "Hello, GitHub Actions!"
      
      - name: Show date
        run: date
      
      - name: List files
        run: ls -la
```

### Step 6: Commit and push

```bash
git add .github/workflows/hello.yml
git commit -m "Add first GitHub Actions workflow"
git push origin dev
```

### Step 7: Check GitHub

Go to: `https://github.com/<username>/<repo>/actions`

You'll see your workflow running! Click on it to see logs.

---

## 🛠️ Real Workflow: Test Node.js App

Now let's write a REAL workflow that tests HostMaster backend:

```yaml
name: Backend Tests

on:
  push:
    branches: [dev, main]
  pull_request:
    branches: [dev, main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      # Step 1: Get the code
      - name: Checkout code
        uses: actions/checkout@v3
      
      # Step 2: Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      # Step 3: Install dependencies
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      # Step 4: Run tests
      - name: Run tests
        working-directory: ./backend
        run: npm test
```

### Breaking it down:

#### 1. **Checkout code**
```yaml
- uses: actions/checkout@v3
```

**What is `uses`?**
- Instead of `run` (run command), `uses` means "use a pre-built action"
- `actions/checkout` = official GitHub action to clone your repo
- `@v3` = version 3 of that action

**Why needed?**
- By default, runner has empty filesystem
- This clones your repo so workflow can access code

#### 2. **Setup Node.js**
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: '20'
```

**`with` keyword:**
- Passes parameters to the action
- Here: "install Node.js version 20"

#### 3. **Install dependencies**
```yaml
- run: npm ci
  working-directory: ./backend
```

**`npm ci` vs `npm install`:**
- `npm ci` = clean install (faster, uses package-lock.json exactly)
- `npm install` = might update dependencies

**`working-directory`:**
- Run command in this folder
- Here: run `npm ci` inside `backend/` folder

#### 4. **Run tests**
```yaml
- run: npm test
  working-directory: ./backend
```

Runs your Jest tests!

---

## 🔐 Secrets Management

Never hardcode passwords/API keys in workflows!

### How to add secrets:

1. **GitHub UI:**
   - Go to repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DB_PASSWORD`
   - Value: `your-secret-password`

2. **Use in workflow:**
```yaml
steps:
  - name: Run tests with database
    run: npm test
    env:
      DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

**Syntax: `${{ secrets.SECRET_NAME }}`**

**Best Practices:**
- ✅ Store all sensitive data as secrets
- ✅ Name secrets in UPPER_SNAKE_CASE
- ❌ Never log secrets (`echo ${{ secrets.PASSWORD }}` is BAD)

---

## ⚡ Caching Dependencies

Problem: `npm ci` downloads 200MB of node_modules EVERY RUN (slow!)

Solution: Cache it!

```yaml
steps:
  - uses: actions/checkout@v3
  
  - uses: actions/setup-node@v3
    with:
      node-version: '20'
      cache: 'npm'  # Auto-cache npm dependencies
      cache-dependency-path: '**/package-lock.json'
  
  - run: npm ci
```

**What happens:**
1st run: Downloads node_modules, saves to cache
2nd run: Restores from cache (10x faster!)

**Advanced caching:**
```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: backend/node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**How it works:**
- `key`: Unique identifier (changes when package-lock.json changes)
- `restore-keys`: Fallback if exact key not found
- Cache invalidates automatically when dependencies change

---

## 🎭 Matrix Builds (Test Multiple Versions)

Test your app across multiple Node.js versions:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20, 21]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - run: npm ci
      - run: npm test
```

**What happens:**
- GitHub runs 3 PARALLEL jobs
- Job 1: Tests with Node 18
- Job 2: Tests with Node 20
- Job 3: Tests with Node 21

**Advanced matrix:**
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node-version: [18, 20]
```

This creates 6 jobs (3 OS × 2 Node versions)!

---

## 🎨 Conditional Steps

Run steps only in certain conditions:

```yaml
steps:
  - name: Run only on main branch
    if: github.ref == 'refs/heads/main'
    run: echo "This is main branch!"
  
  - name: Run only on PRs
    if: github.event_name == 'pull_request'
    run: echo "This is a PR!"
  
  - name: Run only if tests pass
    if: success()
    run: echo "Previous steps succeeded!"
  
  - name: Run even if previous step fails
    if: always()
    run: echo "This always runs!"
```

**Useful contexts:**
- `github.ref` - Current branch
- `github.event_name` - What triggered workflow
- `github.actor` - Who triggered it
- `success()` - Previous steps passed
- `failure()` - Previous step failed
- `always()` - Always run

---

## 📊 Outputs & Job Dependencies

Pass data between steps and jobs:

### Between Steps (same job):
```yaml
steps:
  - name: Set output
    id: vars
    run: echo "sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
  
  - name: Use output
    run: echo "Short SHA is ${{ steps.vars.outputs.sha_short }}"
```

### Between Jobs (different jobs):
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.get_version.outputs.version }}
    steps:
      - id: get_version
        run: echo "version=1.2.3" >> $GITHUB_OUTPUT
  
  deploy:
    needs: build  # Wait for build to finish
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying version ${{ needs.build.outputs.version }}"
```

---

## 🎓 Interview Questions

### Q1: "What's the difference between `uses` and `run`?"

**Answer:**
"`run` executes shell commands directly (like `npm install`). `uses` imports a pre-built action (like `actions/checkout@v3`). Actions are reusable pieces of workflow logic published by GitHub or community. Think of `uses` like importing a function, and `run` like writing inline code."

### Q2: "How do you pass secrets to workflows?"

**Answer:**
"Secrets are stored in GitHub repository settings (Settings → Secrets → Actions), not in code. In workflows, reference them with `${{ secrets.SECRET_NAME }}`. They're encrypted at rest and masked in logs. Never use `echo` or log secrets, as they'll be redacted but still bad practice."

### Q3: "What's the purpose of caching in GitHub Actions?"

**Answer:**
"Caching stores dependencies (like node_modules) between workflow runs to speed up builds. First run downloads and caches, subsequent runs restore from cache. Cache keys are based on lock file hashes, so cache invalidates when dependencies change. This can reduce build time from 2 minutes to 20 seconds."

### Q4: "Explain the workflow: checkout → test → build → deploy"

**Answer:**
```
1. Checkout: Clone repo code to runner
2. Test: Run unit / integration tests
3. Build: Compile/bundle application
4. Deploy: Push to servers (only if tests pass)

Each step runs sequentially. If any fail, workflow stops.
This prevents broken code from reaching production.
```

---

## 🎯 Your Turn: Write a Workflow

**Exercise:** Create `.github/workflows/backend-ci.yml` that:

1. Triggers on push to `dev` branch
2. Runs on Ubuntu
3. Checks out code
4. Sets up Node.js 20
5. Caches npm dependencies
6. Installs dependencies
7. Runs linter (`npm run lint`)
8. Runs tests (`npm test`)
9. Only deploys if tests pass

**Hint - Template:**
```yaml
name: ???
on:
  push:
    branches: ???
jobs:
  test:
    runs-on: ???
    steps:
      - name: ???
        uses: ???
      # ... add more steps
```

**Solution in Part 3!**

---

## 📖 Official Actions You'll Use Often

**GitHub Official:**
- `actions/checkout@v3` - Clone repo
- `actions/setup-node@v3` - Install Node.js
- `actions/cache@v3` - Cache dependencies
- `actions/upload-artifact@v3` - Save build artifacts

**Docker:**
- `docker/login-action@v2` - Login to Docker Hub
- `docker/build-push-action@v4` - Build & push images

**AWS:**
- `aws-actions/configure-aws-credentials@v2` - Set AWS creds
- `aws-actions/amazon-ecr-login@v1` - Login to ECR

**Community:**
- `codecov/codecov-action@v3` - Upload test coverage
- `JamesIves/github-pages-deploy-action@v4` - Deploy to GitHub Pages

---

## 🚀 Next: Part 3 - Enterprise CI/CD Patterns

In Part 3, we'll cover:
- Multi-stage deployments (dev → stage → prod)
- Branch protection rules
- Required checks before merge
- Rollback strategies
- Monitoring & notifications

**Make sure you understand:**
- ✅ YAML syntax (indentation, key-value, lists)
- ✅ Workflow structure (name, on, jobs, steps)
- ✅ `uses` vs `run`
- ✅ Secrets management
- ✅ Caching
- ✅ Matrix builds

**Ready for enterprise patterns? → Part 3!**
