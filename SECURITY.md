# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **security@hostmaster.io**.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment:** Within 48 hours of your report
- **Initial Assessment:** Within 5 business days
- **Status Updates:** Every 7 days until resolution
-  **Fix Timeline:** Critical issues within 7 days, high severity within 30 days

### Disclosure Policy

- We request that you do not publicly disclose the vulnerability until we have released a fix
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We may award bounties for significant vulnerabilities (case-by-case basis)

## Security Measures

HostMaster implements the following security measures:

### Authentication & Authorization
- ✅ JWT-based authentication with 7-day expiry
- ✅ Account lockout after 5 failed login attempts
- ✅ Password strength requirements (12+ characters, complexity)
- ✅ Audit logging for all authentication events

### Data Protection
- ✅ AWS credentials encrypted at rest (AES-256)
- ✅ HTTPS/TLS enforced in production
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (input sanitization)
- ✅ CSRF protection (tokens)

### Infrastructure Security
- ✅ Read-only AWS access (we never modify your infrastructure)
- ✅ Rate limiting to prevent abuse
- ✅ Security headers (Helmet.js)
- ✅ Regular dependency updates
- ✅ Automated security scanning (Snyk, npm audit)

### Monitoring & Incident Response
- ✅ Error tracking (Sentry)
- ✅ Prometheus metrics for anomaly detection
- ✅ CloudWatch alarms for suspicious activity
- ✅ Automated backup and disaster recovery

## Known Limitations

- **AWS Credentials Storage:** Currently stored encrypted in database. Migrating to AWS Secrets Manager in Q1 2026.
- **Rate Limiting:** Currently Redis-based. May not scale beyond 10K users without Redis Cluster.
- **Session Management:** JWT tokens cannot be revoked before expiry. Adding token revocation list in v1.1.

## Security Updates

Security updates are released as:
- **Critical:** Immediate patch release
- **High:** Within 7 days
- **Medium:** Next minor release
- **Low:** Next major release

Subscribe to security advisories: [GitHub Security Advisories](https://github.com/Raj-glitch-max/HostMaster/security/advisories)

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we recognize and reward security researchers who responsibly disclose vulnerabilities:

- **Critical vulnerabilities:** $500-1000 (case-by-case)
- **High severity:** $100-500
- **Medium severity:** Public recognition
- **Low severity:** Public recognition

Rewards are discretionary and based on severity, impact, and quality of report.

## Contact

- **Security Team:** security@hostmaster.io
- **PGP Key:** [Download](https://hostmaster.io/pgp-key.asc)
- **Response Time:** 48 hours maximum

## Legal

By responsibly disclosing vulnerabilities, you agree to:
- Not access, modify, or delete user data without explicit permission
- Not perform testing on production systems without authorization
- Allow us reasonable time to fix the issue before public disclosure

We commit to not pursuing legal action against security researchers who:
- Make good faith security reports
- Avoid privacy violations, data destruction, and service disruption
- Do not exploit vulnerabilities for personal gain

---

**Last Updated:** January 2026
