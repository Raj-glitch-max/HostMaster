# Contributing to HostMaster

First off, thank you for considering contributing to HostMaster! It's people like you that make HostMaster better for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. macOS, Ubuntu]
 - Node version: [e.g. 20.10.0]
 - Docker version: [e.g. 24.0.0]

**Additional context**
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List some examples of where this enhancement could be used**

### Pull Requests

1. **Fork the repo** and create your branch from `dev`
2. **Write clear commit messages** following [Conventional Commits](https://www.conventionalcommits.org/)
3. **Add tests** for any new functionality
4. **Ensure all tests pass** (`npm test`)
5. **Update documentation** if needed
6. **Submit your PR** with a clear description

**PR Template:**
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### Setup Steps

1. **Clone your fork**
```bash
git clone https://github.com/YOUR_USERNAME/HostMaster.git
cd HostMaster
```

2. **Install dependencies**
```bash
cd backend && npm install
cd ../frontend && npm install
```

3. **Set up environment**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your local settings
```

4. **Start services**
```bash
docker-compose up -d postgres redis
```

5. **Run migrations**
```bash
cd backend
npm run migrate
```

6. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm test -- --coverage      # With coverage
npm test -- --watch         # Watch mode

# Frontend tests
cd frontend
npm test
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
```

**Style Guidelines:**
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in objects/arrays
- Max line length: 100 characters

### Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add support for Azure cloud scanning

fix(auth): resolve JWT expiration issue

docs(readme): update installation instructions

test(costs): add integration tests for cost analysis
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring

## Project Structure

```
HostMaster/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Helper functions
│   └── tests/            # Backend tests
├── frontend/             # Next.js app
│   ├── app/              # Pages (App Router)
│   ├── components/       # React components
│   └── lib/              # Utilities
├── terraform/            # Infrastructure as code
└── docker-compose.yml    # Local development
```

## Testing Strategy

### Unit Tests
- Test individual functions/modules
- Mock external dependencies
- Fast execution (<1s per test)

### Integration Tests
- Test API endpoints
- Use test database
- Test database interactions

### E2E Tests
- Test complete user flows
- Use Playwright
- Run in CI/CD only (slow)

## Need Help?

- 💬 Join our [Discord](https://discord.gg/hostmaster)
- 📧 Email: [dev@hostmaster.io](mailto:dev@hostmaster.io)
- 📚 Check the [documentation](https://docs.hostmaster.io)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
