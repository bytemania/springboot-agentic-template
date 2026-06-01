---
description: "Run a security review of the current code against OWASP Top 10 for Spring Boot APIs"
---

Perform a security review of the current Spring Boot project.

Steps:
1. Read CLAUDE.md to understand the stack.
2. Invoke the security-reviewer agent to perform the review.
3. The review must cover:
   - Input validation on all request DTOs and path variables
   - SQL injection risks (native queries, string concatenation)
   - Sensitive data in API responses or logs
   - Actuator endpoint exposure
   - Stack trace leakage in error responses
   - Authentication and authorisation gaps
4. Report findings in three buckets:
   - Critical: must fix before merge
   - High: fix before or soon after shipping
   - Medium/Low: track for future improvement
5. For each critical or high finding, produce the exact code fix needed.

Output format:
- Security summary (one paragraph)
- Critical findings with file:line and recommended fix
- High findings with file:line and recommendation
- Secure patterns observed
