# Git Mastery: From Zero to Interview-Ready Expert

**Reading time:** 60 minutes  
**Mastery level:** Complete understanding from fundamentals to enterprise workflows

---

## Table of Contents
1. [Why Version Control Exists](#why-version-control-exists)
2. [Git Fundamentals](#git-fundamentals)
3. [Git Architecture](#git-architecture)
4. [Core Concepts Deep Dive](#core-concepts-deep-dive)
5. [Branching Strategies](#branching-strategies)
6. [Advanced Git Operations](#advanced-git-operations)
7. [Enterprise Workflows](#enterprise-workflows)
8. [Best Practices](#best-practices)
9. [Interview Questions](#interview-questions)

---

## Why Version Control Exists

### The Problem (Without Version Control)

Imagine building software without Git:

```
project/
├─ final.js
├─ final_v2.js
├─ final_v2_actually_final.js
├─ final_v2_actually_final_REAL.js
└─ final_DONT_TOUCH_THIS_ONE.js
```

**Challenges:**
1. **Lost work** - Accidentally overwrite good code
2. **No collaboration** - How do 5 developers work on same file?
3. **No history** - Can't see who changed what, when, why
4. **No rollback** - Bug introduced 2 weeks ago? Can't undo
5. **No experimentation** - Can't try new features without risking production

### The Solution: Version Control

**Version Control** = System that tracks changes to files over time

**Benefits:**
- **Time machine** - Revert to any previous state
- **Parallel universes** - Work on multiple features simultaneously (branches)
- **Collaboration** - Multiple people, same codebase, no conflicts
- **Audit trail** - Who changed what, when, why
- **Safety net** - Experiment without fear

---

## Git Fundamentals

### What is Git?

**Git** = Distributed version control system created by Linus Torvalds (2005)

**Key insight:** Git is NOT GitHub
- **Git** = The technology (runs on your computer)
- **GitHub** = A website that hosts Git repositories (like Google Drive for code)

### Git vs Other Version Control Systems

| Feature | Git (Distributed) | SVN (Centralized) |
|---------|-------------------|-------------------|
| Repository | Every dev has full copy | One central server |
| Speed | Fast (local operations) | Slow (network calls) |
| Offline work | ✅ Yes | ❌ No |
| Branching | Extremely fast | Slow |
| Learning curve | Steeper | Easier |
| Industry standard | ✅ 95% of companies | ❌ Legacy |

**Interview answer:** "I use Git because it's distributed (can work offline), branching is instant, and it's the industry standard. SVN requires constant server connection and branching is expensive."

---

## Git Architecture

### The Three Trees

Git has three main areas where your code lives:

```
Working Directory          Staging Area         Repository (Commit History)
(Your files)          (git add)         (git commit)
    
file.js      ──────────▶    file.js    ──────────▶    Commit: abc123
                                                       (snapshot of files)
```

**1. Working Directory**
- The actual files you see and edit
- Contains your current work

**2. Staging Area (Index)**
- "Preparation area" for next commit
- `git add` moves files here
- Lets you curate what goes into a commit

**3. Repository (History)**
- All commits stored here
- `.git/` folder
- Permanent record

### Why the Staging Area?

**Without staging:**
```bash
# You changed 5 files
# Want to commit only 3
# Have to commit all 5 or none
```

**With staging:**
```bash
# Change 5 files
git add file1.js file2.js file3.js  # Stage only these
git commit -m "Feature X complete"   # Commit only staged files
# file4.js and file5.js stay uncommitted
```

**Interview answer:** "Staging area lets me create focused, atomic commits even when I've changed many files. I can stage related changes together and commit them separately."

---

## Core Concepts Deep Dive

### 1. Commits

**What is a Commit?**
- Snapshot of your entire project at a point in time
- Has a unique ID (SHA-1 hash): `a3b5c74...`
- Contains: changed files, author, timestamp, message, parent commit

**Anatomy of a commit:**
```
Commit: a3b5c74d8e9f1a2b3c4d5e6f7g8h9i0j
Author: Raj <raj@example.com>
Date:   Thu Jan 16 22:00:00 2026

    Add user authentication endpoint
    
    - Implement JWT token generation
    - Add password hashing with bcrypt
    - Create /api/auth/login endpoint
```

**Best practice - Commit message format:**
```
<type>: <subject>

<body>

<footer>
```

Example:
```
feat: Add user authentication

- Implement JWT-based authentication
- Add login and registration endpoints
- Hash passwords using bcrypt

Closes #42
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code restructuring (no functionality change)
- `test`: Adding tests
- `chore`: Build process, dependencies

### 2. Branches

**What is a Branch?**
- A movable pointer to a commit
- Lets you work on features in isolation

**Mental model:**
```
main branch (production-ready code)
  │
  │  feature branch (new feature)
  ├─────────▶
  │           │
  │           │ (work on feature)
  │           │
  │  ◀────────┘ (merge back when done)
  │
```

**Why branches?**
1. **Isolation** - Feature A doesn't break Feature B
2. **Experimentation** - Try ideas without risk
3. **Collaboration** - 5 developers, 5 branches, no conflicts
4. **Releases** - Maintain production while building next version

**Creating and switching branches:**
```bash
# Old way
git branch feature-login    # Create branch
git checkout feature-login  # Switch to it

# New way (Git 2.23+)
git switch -c feature-login  # Create and switch

# See all branches
git branch -a

# Delete branch
git branch -d feature-login
```

### 3. Merging

**What is Merging?**
- Combining changes from two branches

**Types of merges:**

#### Fast-Forward Merge
```
Before:
main:    A─B─C
              │
feature:      └─D─E

After fast-forward:
main:    A─B─C─D─E
```

No new commit created. Just moves pointer forward.

```bash
git checkout main
git merge feature  # Fast-forward
```

#### 3-Way Merge
```
Before:
main:    A─B─C─F
              │
feature:      └─D─E

After 3-way merge:
main:    A─B─C─F─G  (G = merge commit)
              │  │
feature:      └─D─E
```

Creates a new "merge commit" that has 2 parents.

```bash
git checkout main
git merge feature  # Creates merge commit
```

#### Rebase (Alternative to Merge)
```
Before:
main:    A─B─C─F
              │
feature:      └─D─E

After rebase:
main:    A─B─C─F
                 │
feature:         └─D'─E'  (D and E rewritten)
```

Rewrites history to make it linear.

```bash
git checkout feature
git rebase main  # Replay feature commits on top of main
```

**Merge vs Rebase?**

| Merge | Rebase |
|-------|--------|
| Preserves history | Rewrites history |
| Creates merge commits | Linear history |
| Safer (never loses commits) | Can cause issues if used wrong |
| For public branches | For private feature branches |

**Interview answer:** "I use merge for public branches to preserve history. I use rebase for my private feature branches before merging to keep history clean."

### 4. Remote Repositories

**What is a Remote?**
- A version of your repository hosted elsewhere (GitHub, GitLab, Bitbucket)

**Key commands:**
```bash
# Add remote
git remote add origin https://github.com/user/repo.git

# View remotes
git remote -v

# Push to remote
git push origin main

# Pull from remote
git pull origin main  # Same as: git fetch + git merge

# Fetch without merging
git fetch origin
```

**Push vs Pull:**
- **Push** = Upload your commits to remote
- **Pull** = Download remote commits to your local
- **Fetch** = Download remote commits BUT don't merge (safer)

---

## Branching Strategies

### 1. Git Flow (Traditional)

```
main (production)
  │
  ├─ develop (integration branch)
  │    │
  │    ├─ feature/login (feature branches)
  │    ├─ feature/dashboard
  │    │
  ├─ release/1.0 (release preparation)
  │
  ├─ hotfix/critical-bug (emergency fixes)
```

**Branches:**
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `release/*`: Release preparation
- `hotfix/*`: Emergency production fixes

**Pros:** Structured, good for scheduled releases  
**Cons:** Complex, slow

### 2. GitHub Flow (Simpler)

```
main (always deployable)
  │
  ├─ feature/login
  ├─ feature/dashboard
  ├─ hotfix/bug-123
```

**Rules:**
1. `main` is always deployable
2. Create branch for ANY change
3. Open Pull Request
4. Get review, CI passes
5. Merge to `main`
6. Deploy immediately

**Pros:** Simple, fast, continuous deployment  
**Cons:** Less control for complex projects

### 3. Trunk-Based Development (Modern)

```
main (trunk)
  │
People commit directly to main (with CI/CD protection)
Short-lived feature branches (< 1 day)
```

**Pros:** Fastest, least merge conflicts  
**Cons:** Requires strong CI/CD, feature flags

### 4. HostMaster Strategy (4 Branches)

```
main (tagged releases)
  │
  ├─ prod (production)
  │    │
  │    ├─ stage (staging/UAT)
  │    │    │
  │    │    ├─ dev (development)
  │    │    │    │
  │    │    │    ├─ feature/cost-analysis
  │    │    │    ├─ feature/alerts
```

**Flow:**
1. Develop features in `feature/*` branches
2. Merge to `dev` → CI runs tests, deploys to dev environment
3. When ready for QA → PR to `stage` → deploys to staging
4. When approved → PR to `prod` → deploys to production
5. Tag production releases on `main`

---

## Advanced Git Operations

### 1. Stashing (Temporary Save)

**Problem:** You're working on Feature A, but need to urgently fix a bug in production.

```bash
# You have uncommitted changes
git stash  # Save changes temporarily

# Switch to main, fix bug, commit
git checkout main
# ... fix bug ...
git commit -m "Fix critical bug"

# Go back to feature branch
git checkout feature-A
git stash pop  # Restore your changes
```

### 2. Cherry-Pick (Selective Commit Copy)

**Problem:** You want ONE specific commit from another branch.

```bash
# On feature branch, there's commit abc123 you want
git checkout main
git cherry-pick abc123  # Copy that commit to main
```

### 3. Reset vs Revert

**Reset** (Rewrite history):
```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes
git reset --hard HEAD~1
```

**Revert** (Create new commit that undoes):
```bash
# Undo commit abc123 by creating new commit
git revert abc123
```

**Rule:** 
- Use `reset` on PRIVATE branches (not pushed)
- Use `revert` on PUBLIC branches (already pushed)

### 4. Interactive Rebase (Clean History)

```bash
# Rewrite last 3 commits
git rebase -i HEAD~3
```

Opens editor:
```
pick a1b2c3 Add feature X
pick d4e5f6 Fix typo
pick g7h8i9 Add tests

# Change to:
pick a1b2c3 Add feature X
squash d4e5f6 Fix typo      # Combine with previous
squash g7h8i9 Add tests     # Combine with previous
```

Result: 3 commits become 1 clean commit.

---

## Enterprise Workflows

### 1. Pull Request (PR) Process

```
1. Create feature branch
   git checkout -b feature/user-auth

2. Make changes, commit
   git add .
   git commit -m "Implement JWT authentication"

3. Push to remote
   git push origin feature/user-auth

4. Open Pull Request on GitHub
   - Add description
   - Link related issues
   - Request reviewers

5. Code review
   - Reviewers leave comments
   - You address feedback
   - CI/CD runs tests

6. Merge when approved
   - Squash and merge (clean history)
   - OR Merge commit (preserve history)
   - Delete feature branch after merge
```

### 2. Branch Protection Rules

**On GitHub (Settings → Branches):**
- ✅ Require pull request before merging
- ✅ Require approvals (minimum 2)
- ✅ Require status checks to pass (CI)
- ✅ Require conversation resolution
- ✅ Require signed commits
- ✅ Include administrators (no bypass)

---

## Best Practices

### Commit Messages
```bash
# BAD
git commit -m "fix"
git commit -m "changes"
git commit -m "asdf"

# GOOD
git commit -m "fix: Resolve null pointer in user login"
git commit -m "feat: Add cost analysis endpoint"
git commit -m "refactor: Extract database connection logic"
```

### Commit Frequency
- **Commit often** - Small, focused commits
- Each commit should be "atomic" (one logical change)
- Easier to review, debug, revert

### Branch Naming
```bash
# Bad
git checkout -b fix
git checkout -b new-branch

# Good
git checkout -b feat/user-authentication
git checkout -b fix/login-crash-on-invalid-password
git checkout -b refactor/extract-auth-middleware
```

### Never Commit
- Passwords, API keys, secrets
- Large binary files
- `node_modules/`, build artifacts
- `.env` files
- IDE config (`.vscode/`, `.idea/`)

Use `.gitignore`:
```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local

# Build
dist/
build/

# IDE
.vscode/
.idea/
```

---

## Interview Questions

### Q1: What is Git? Why use it?
**A:** Git is a distributed version control system that tracks changes to code over time. I use it because it allows collaboration (multiple developers), maintains history (can revert bugs), enables experimentation through branching, and is the industry standard.

### Q2: Explain git pull vs git fetch
**A:** `git fetch` downloads commits from remote but doesn't merge them. `git pull` = `git fetch` + `git merge`. I prefer `git fetch` first to review changes before merging.

### Q3: What's the difference between git merge and git rebase?
**A:** Merge creates a new merge commit and preserves history. Rebase rewrites history by replaying commits on top of another branch, creating linear history. I use merge for public branches and rebase for private feature branches before merging.

### Q4: How do you undo the last commit?
**A:** Depends on whether it's pushed:
- **Not pushed:** `git reset --soft HEAD~1` (keeps changes) or `git reset --hard HEAD~1` (discards changes)
- **Already pushed:** `git revert HEAD` (creates new commit that undoes changes)

### Q5: What is a merge conflict and how do you resolve it?
**A:** A merge conflict occurs when Git can't automatically merge changes (e.g., both branches modified the same line). I resolve by:
1. `git merge feature` (conflict occurs)
2. Open conflicted files, look for `<<<<<<<` markers
3. Manually choose which changes to keep
4. `git add` resolved files
5. `git commit` to complete merge

### Q6: Explain Git branching strategy you'd use for a production app
**A:** I'd use a 4-branch strategy similar to GitHub Flow:
- `main`: Tagged releases
- `prod`: Production code
- `stage`: Staging/QA environment
- `dev`: Development integration
- Feature branches merge to `dev`, then PR through `stage` → `prod` with CI/CD gates at each level.

### Q7: How do you maintain a clean Git history?
**A:** 
1. Use interactive rebase to squash fix commits before merging
2. Write descriptive commit messages (conventional commits format)
3. Make atomic commits (one logical change per commit)
4. Use squash merge on PRs for linear history

### Q8: What's the difference between git reset, git revert, and git checkout?
**A:** 
- `git reset`: Moves branch pointer backward (rewrites history)
- `git revert`: Creates new commit that undoes changes (preserves history)
- `git checkout`: Switches branches or restores files

### Q9: How do you keep a feature branch up to date with main?
**A:** Two approaches:
1. **Merge:** `git checkout feature && git merge main` (preserves history)
2. **Rebase:** `git checkout feature && git rebase main` (linear history)

I prefer rebase for private branches, merge for shared branches.

### Q10: Explain git stash
**A:** `git stash` temporarily saves uncommitted changes so you can switch branches. Use case: Working on feature A, need to urgently fix bug on main. I `git stash`, switch to main, fix bug, commit, then `git stash pop` to restore my work on feature A.

---

## Summary

**Git Mastery Checklist:**
- ✅ Understand why version control exists
- ✅ Know the three areas: working directory, staging, repository
- ✅ Can explain commits, branches, merges
- ✅ Understand branching strategies
- ✅ Know when to use merge vs rebase
- ✅ Can resolve conflicts
- ✅ Follow best practices (commit messages, frequency)
- ✅ Understand enterprise workflows (PRs, branch protection)
- ✅ Can answer all interview questions confidently

**Next:** Study GitHub Actions (CI/CD) to automate testing and deployment of every commit.
