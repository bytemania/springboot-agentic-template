---
name: security-review
description: >
  Perform a security review of the Spring Boot project focusing on OWASP Top 10 risks.
  Use before merging a feature, after adding new endpoints, or when handling sensitive data.
---

# Skill: security-review

## OWASP Top 10 checklist for Spring Boot APIs

### A01 Broken Access Control
- [ ] All endpoints are protected with appropriate Spring Security rules.
- [ ] No admin or sensitive endpoints are accidentally public.
- [ ] Users cannot access or modify other users' resources.

### A02 Cryptographic Failures
- [ ] Passwords are hashed with BCrypt — never stored in plaintext.
- [ ] Sensitive config values (secrets, credentials) are not hardcoded.
- [ ] HTTPS is enforced in production.

### A03 Injection
- [ ] No native SQL queries constructed with string concatenation.
- [ ] All JPQL queries use named parameters.
- [ ] Path variables and query params are validated.

### A04 Insecure Design
- [ ] Business logic enforces authorisation — not just HTTP-layer checks.
- [ ] Rate limiting is considered for public endpoints.

### A05 Security Misconfiguration
- [ ] Spring Boot Actuator endpoints are not publicly exposed (/actuator/**).
- [ ] Error responses do not expose stack traces.
- [ ] DEBUG logging is disabled in production.

### A06 Vulnerable and Outdated Components
- [ ] Dependencies are up to date (run ./gradlew dependencyUpdates if available).

### A07 Identification and Authentication Failures
- [ ] JWTs or sessions are validated on every request.
- [ ] Token expiry is enforced.

### A09 Security Logging and Monitoring Failures
- [ ] Authentication failures are logged at WARN level.
- [ ] Sensitive data (passwords, tokens, PII) is never logged.

## How to run a review

1. Invoke the security-reviewer agent with the files or diff to review.
2. Work through each checklist item above.
3. Report critical findings (must fix before merge) and high findings (fix soon).

## Rules

- Never log request bodies that may contain passwords or tokens.
- Never return stack traces in API error responses.
- Always use parameterised queries.
