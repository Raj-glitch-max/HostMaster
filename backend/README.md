# HostMaster Backend API

Production-grade REST API for AWS cost optimization and resource management.

## Features

- **Authentication:** JWT-based authentication with bcrypt password hashing
- **AWS Integration:** Scan EC2, RDS, S3 resources and analyze costs
- **Cost Analysis:** Break down costs by service, region, and provide optimization recommendations
- **Logging:** Structured logging with Winston
- **Security:** Helmet.js security headers, input validation, CORS
- **Error Handling:** Centralized error handling with detailed logging

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL (via RDS in production)
- **Authentication:** JWT + bcrypt
- **AWS SDK:** Resource scanning and cost analysis
- **Logging:** Winston
- **Validation:** express-validator
- **Testing:** Jest + Supertest

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or use Docker)
- AWS Account with IAM credentials

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run in development mode
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

### Environment Variables

See `.env.example` for all required variables:
- `PORT`: Server port (default: 3000)
- `DB_*`: PostgreSQL connection details
- `JWT_SECRET`: Secret for JWT token signing
- `AWS_*`: AWS credentials (use IAM roles in production)

## API Endpoints

### Authentication

**POST /api/v1/auth/register**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**POST /api/v1/auth/login**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

###Resources

**GET /api/v1/resources** (requires authentication)
Returns all AWS resources (EC2, RDS, S3) with costs

### Costs

**GET /api/v1/costs** (requires authentication)
Returns cost analysis with breakdown by service/region and optimization recommendations

## Project Structure

```
backend/
├─ src/
│  ├─ server.js          # Express app entry point
│  ├─ routes/            # API route handlers
│  │  ├─ auth.js
│  │  ├─ resources.js
│  │  └─ costs.js
│  ├─ controllers/       # Business logic (TODO)
│  ├─ models/            # Database models (TODO)
│  ├─ middleware/        # Custom middleware
│  │  └─ errorHandler.js
│  ├─ services/          # AWS SDK integration (TODO)
│  └─ utils/            # Utilities
│     └─ logger.js
├─ tests/               # Jest tests (TODO)
├─ config/              # Configuration files
├─ logs/                # Winston log files
├─ Dockerfile          # Docker configuration
├─ package.json
└─ .env.example
```

## Docker

```bash
# Build image
docker build -t hostmaster-backend .

# Run container
docker run -p 3000:3000 --env-file .env hostmaster-backend
```

##Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Logging

Logs are written to:
- Console (all levels with colors)
- `logs/error.log` (errors only)
- `logs/combined.log` (all levels)

Log format: JSON with timestamp, level, message, metadata

## Security

- **Helmet.js:** Security headers
- **CORS:** Configured allowed origins
- **Input validation:** express-validator on all inputs
- **Password hashing:** bcrypt with 10 rounds
- **JWT:** Signed tokens with expiration
- **Rate limiting:** TODO - add express-rate-limit

## TODO

- [ ] Implement PostgreSQL database models
- [ ] Add authentication middleware to protected routes
- [ ] Integrate AWS SDK for resource scanning
- [ ] Add rate limiting middleware
- [ ] Write comprehensive tests (unit + integration)
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement caching layer (Redis)
- [ ] Add database migrations

## License

MIT
