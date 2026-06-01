export const meta = {
  name: 'feature-end-to-end',
  description: 'Full feature delivery: analyse → architect → plan → migrate → implement → test → security → observability → review → ship → frontend',
  phases: [
    { title: 'Analyse',       detail: 'Read the codebase and produce a structured feature analysis' },
    { title: 'Architect',     detail: 'Architect reviews analysis and approves the design' },
    { title: 'Plan',          detail: 'Produce a detailed implementation plan for every layer' },
    { title: 'Migrate',       detail: 'Write and validate the Flyway schema migration' },
    { title: 'Implement',     detail: 'Generate domain, DTOs, repository, service, controller, exception handling' },
    { title: 'Test',          detail: 'Write and run unit + controller slice + integration tests' },
    { title: 'Security',      detail: 'Security review the new code for OWASP Top 10 risks' },
    { title: 'Observability', detail: 'Add Micrometer counters/timers and OTEL spans for key operations' },
    { title: 'Review',        detail: 'Code-review the full diff; auto-fix critical/high findings' },
    { title: 'Ship',          detail: 'Parallel final build + unit tests + integration tests gate' },
    { title: 'Frontend',      detail: 'Sync React frontend: types, API wrappers, hooks, page components' },
  ],
}

const featureSpec = args || 'Describe the feature you want to build end-to-end'
const ROOT = '/Users/sergio/CoworkSandbox/springboot-agentic-template'

// ─── Phase 1: Analyse ─────────────────────────────────────────────────────────
phase('Analyse')

const analysis = await agent(
  `You are a senior backend engineer performing codebase discovery.
Project root: ${ROOT}

1. Read ${ROOT}/CLAUDE.md for architecture rules.
2. Glob ${ROOT}/src/main/java/**/*.java — catalogue every existing entity, repository, service, and controller.
3. Glob ${ROOT}/src/main/resources/db/migration/**/*.sql — understand the current schema and highest migration version.
4. Analyse the feature spec and identify:
   - New or modified domain entities and their fields (name, Java type, nullable)
   - New API endpoints (HTTP method + path + one-line purpose)
   - Business invariants the service layer must enforce
   - Error conditions each endpoint must handle

Feature spec: "${featureSpec}"
Return a JSON object matching the schema exactly.`,
  {
    label: 'analyse',
    schema: {
      type: 'object',
      properties: {
        existingEntities:        { type: 'array', items: { type: 'string' } },
        highestMigrationVersion: { type: 'number' },
        newEntities: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, fields: { type: 'array', items: { type: 'string' } } },
            required: ['name', 'fields']
          }
        },
        endpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: { method: { type: 'string' }, path: { type: 'string' }, purpose: { type: 'string' } },
            required: ['method', 'path', 'purpose']
          }
        },
        businessRules: { type: 'array', items: { type: 'string' } },
        errorCases:    { type: 'array', items: { type: 'string' } },
      },
      required: ['existingEntities', 'highestMigrationVersion', 'newEntities', 'endpoints', 'businessRules', 'errorCases']
    }
  }
)

log(`Existing entities: ${analysis.existingEntities.length}. New entities: ${analysis.newEntities.length}. Endpoints: ${analysis.endpoints.length}. Highest migration: V${analysis.highestMigrationVersion}.`)

// ─── Phase 2: Architect ───────────────────────────────────────────────────────
phase('Architect')

const architectDecision = await agent(
  `You are the project architect for a Spring Boot 3 + Java 21 API.
Project root: ${ROOT}

Read ${ROOT}/CLAUDE.md — confirm architecture rules:
- Layered architecture: controller → service → repository → domain → dto
- No Lombok. Constructor injection. Records for DTOs.
- Entity IDs: Long with @GeneratedValue(strategy = GenerationType.IDENTITY) — never UUID.
- Flyway owns the schema. Never use ddl-auto=create.

Review the feature analysis and decide:
1. Is the proposed domain model consistent with existing conventions?
2. Are there entity relationships (OneToMany, ManyToOne) that need explicit attention?
3. Are there architecture rule violations to prevent?
4. Approve the design or list required corrections before planning begins.

Feature spec: "${featureSpec}"
Analysis: ${JSON.stringify(analysis, null, 2)}

Return a JSON object matching the schema exactly.`,
  {
    label: 'architect-review',
    agentType: 'java-architect',
    schema: {
      type: 'object',
      properties: {
        approved:          { type: 'boolean' },
        requiredChanges:   { type: 'array', items: { type: 'string' } },
        architectureNotes: { type: 'array', items: { type: 'string' } }
      },
      required: ['approved', 'requiredChanges', 'architectureNotes']
    }
  }
)

log(`Architect approved: ${architectDecision.approved}. Notes: ${architectDecision.architectureNotes.join(' | ')}`)

// ─── Phase 3: Plan ────────────────────────────────────────────────────────────
phase('Plan')

const plan = await agent(
  `You are a senior backend engineer creating a detailed implementation plan.
Project root: ${ROOT}

Feature spec: "${featureSpec}"
Analysis: ${JSON.stringify(analysis, null, 2)}
Architect decision: ${JSON.stringify(architectDecision, null, 2)}

For each endpoint produce:
- Request DTO record fields with @Valid annotation notes
- Response DTO record fields
- Service method signature
- Repository query method name (if custom finder needed)
- Exception class name and HTTP status code
- 3 unit test scenario names
- 2 integration test scenario names

List every Flyway migration needed. Filenames start at V${analysis.highestMigrationVersion + 1}__.
Entity IDs must use Long + BIGSERIAL — never UUID.

Return a JSON object matching the schema exactly.`,
  {
    label: 'plan',
    schema: {
      type: 'object',
      properties: {
        migrationFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: { filename: { type: 'string' }, sqlSummary: { type: 'string' } },
            required: ['filename', 'sqlSummary']
          }
        },
        endpointPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method:           { type: 'string' }, path: { type: 'string' },
              requestDto:       { type: 'string' }, responseDto: { type: 'string' },
              serviceMethod:    { type: 'string' }, repositoryQuery: { type: 'string' },
              exceptionClass:   { type: 'string' }, httpStatus: { type: 'number' },
              unitTests:        { type: 'array', items: { type: 'string' } },
              integrationTests: { type: 'array', items: { type: 'string' } }
            },
            required: ['method', 'path', 'requestDto', 'responseDto', 'serviceMethod',
                       'repositoryQuery', 'exceptionClass', 'httpStatus', 'unitTests', 'integrationTests']
          }
        }
      },
      required: ['migrationFiles', 'endpointPlans']
    }
  }
)

log(`Plan: ${plan.migrationFiles.length} migration(s), ${plan.endpointPlans.length} endpoint(s).`)

// ─── Phase 4: Migrate ─────────────────────────────────────────────────────────
phase('Migrate')

await agent(
  `You are a senior database engineer.
Project root: ${ROOT}

Write the following Flyway migration SQL files under ${ROOT}/src/main/resources/db/migration/.
Migration plan: ${JSON.stringify(plan.migrationFiles, null, 2)}

Rules:
- Flyway naming: V<next_version>__<snake_description>.sql
- BIGSERIAL PRIMARY KEY named id (never UUID).
- snake_case column names, appropriate NOT NULL / UNIQUE constraints.
- H2 compatible: no JSONB, no CONCURRENT INDEX, no GENERATED ALWAYS AS IDENTITY.
- NOT NULL columns added to existing tables must have a DEFAULT.
- Never modify an already-applied migration — create a new version.
After writing, run ./gradlew test to confirm Flyway validates without error.`,
  { label: 'migrate', agentType: 'database-engineer' }
)

// ─── Phase 5: Implement ───────────────────────────────────────────────────────
phase('Implement')

await agent(
  `You are a senior Spring Boot engineer.
Project root: ${ROOT}

Read ${ROOT}/CLAUDE.md first. Follow the layered architecture strictly.
Feature spec: "${featureSpec}"
Plan: ${JSON.stringify(plan, null, 2)}
Analysis: ${JSON.stringify(analysis, null, 2)}

Implement in this exact order:
1. Domain @Entity class(es) — Long id, no Lombok, constructor injection
2. JPA Repository interface(s)
3. Request DTO records with @Valid constraints
4. Response DTO records
5. Custom exception classes with @ResponseStatus or @ControllerAdvice entry
6. Global ErrorResponse record if not already present
7. Service class — enforces all business rules from analysis
8. Controller class — HTTP mapping only, delegates entirely to service

Do NOT run tests yet — that is the next phase.`,
  { label: 'implement', agentType: 'spring-boot-engineer' }
)

// ─── Phase 6: Test ────────────────────────────────────────────────────────────
phase('Test')

await agent(
  `You are a senior testing engineer.
Project root: ${ROOT}

Read ${ROOT}/CLAUDE.md first.
Feature spec: "${featureSpec}"
Test scenarios to cover:
${JSON.stringify(plan.endpointPlans.flatMap(e => [...e.unitTests, ...e.integrationTests]), null, 2)}

Write in this order:
1. Unit tests (src/test/java/): @ExtendWith(MockitoExtension.class), service layer, JUnit 5 + AssertJ.
   Cover: happy path, all error cases, all business rule branches.
2. Controller slice tests (src/test/java/): @WebMvcTest + MockMvc.
   Cover: status codes, JSON shape, validation rejection (400), not found (404).
3. Integration tests (src/integrationTest/java/): @SpringBootTest + Testcontainers PostgreSQL.
   Cover: full HTTP → DB → HTTP cycle.

Run ./gradlew test and ./gradlew integrationTest.
Fix all compilation and test failures before declaring done.`,
  { label: 'test', agentType: 'testing-engineer' }
)

// ─── Phase 7: Security ────────────────────────────────────────────────────────
phase('Security')

const securityFindings = await agent(
  `You are a senior application security engineer.
Project root: ${ROOT}

Run: git diff HEAD in ${ROOT}
Security-review the new code for:
- Input validation on all new request DTOs and path variables
- SQL injection: any native query with string concatenation
- Sensitive data in API responses or log statements
- Missing authentication/authorisation checks on new endpoints
- Stack trace exposure in error responses
- Mass assignment: are request DTOs used at the boundary or raw entities?

Return findings with severity critical, high, medium, or low.`,
  {
    label: 'security-review',
    agentType: 'security-reviewer',
    schema: {
      type: 'object',
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              file:     { type: 'string' },
              finding:  { type: 'string' }
            },
            required: ['severity', 'file', 'finding']
          }
        },
        passed: { type: 'boolean' }
      },
      required: ['findings', 'passed']
    }
  }
)

const securityBlockers = securityFindings.findings.filter(f => f.severity === 'critical' || f.severity === 'high')
if (securityBlockers.length > 0) {
  log(`Security: ${securityBlockers.length} blocker(s) — auto-fixing`)
  await agent(
    `You are a senior Spring Boot engineer.
Fix these security findings in ${ROOT}:
${JSON.stringify(securityBlockers, null, 2)}
Run ./gradlew test after fixing.`,
    { label: 'fix-security', agentType: 'spring-boot-engineer' }
  )
}

// ─── Phase 8: Observability ───────────────────────────────────────────────────
phase('Observability')

await agent(
  `You are a senior observability engineer.
Project root: ${ROOT}

Read ${ROOT}/CLAUDE.md for observability conventions.
Grep for existing MeterRegistry, Counter, Timer, @Timed, Tracer usage.

For each service method that represents a key business operation in the new feature:
1. Add a Micrometer counter (e.g. tasks.created.total with a priority tag).
2. Add a Micrometer timer for any method that queries the database (e.g. tasks.findAll.duration).
3. Add an OTEL span for the most critical or slowest operation.

After adding instrumentation, run ./gradlew test to confirm no regressions.
Verify the new metrics appear in: curl -s http://localhost:8080/actuator/prometheus | grep tasks`,
  { label: 'observability', agentType: 'observability-engineer' }
)

// ─── Phase 9: Review ──────────────────────────────────────────────────────────
phase('Review')

const review = await agent(
  `You are a senior Spring Boot code reviewer.
Project root: ${ROOT}

Run: git diff HEAD
Review the diff for:
- Correctness bugs: null handling, missing validation, wrong HTTP status codes
- Business rule gaps: are all invariants from the spec enforced?
- Spring Boot anti-patterns: logic in controller, missing @Transactional, field injection
- Security basics: no sensitive data in responses, input sanitised
- Test gaps: missing edge cases or failure paths
- Observability gaps: are Micrometer counters/timers present for key business events?

Return findings with severity critical, high, medium, or low.`,
  {
    label: 'code-review',
    agentType: 'security-reviewer',
    schema: {
      type: 'object',
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              file:     { type: 'string' },
              finding:  { type: 'string' }
            },
            required: ['severity', 'file', 'finding']
          }
        },
        approved: { type: 'boolean' }
      },
      required: ['issues', 'approved']
    }
  }
)

const reviewBlockers = review.issues.filter(i => i.severity === 'critical' || i.severity === 'high')
if (reviewBlockers.length > 0) {
  log(`Review: ${reviewBlockers.length} blocker(s) — auto-fixing`)
  await agent(
    `You are a senior Spring Boot engineer.
Fix these review findings in ${ROOT}:
${JSON.stringify(reviewBlockers, null, 2)}
Run ./gradlew test after fixing.`,
    { label: 'fix-review', agentType: 'spring-boot-engineer' }
  )
}

// ─── Phase 10: Ship ───────────────────────────────────────────────────────────
phase('Ship')

const [build, unitTests] = await parallel([
  () => agent(
    `Run ./gradlew clean build in ${ROOT}. Return { passed: boolean, output: string }.`,
    { label: 'final-build', schema: { type: 'object', properties: { passed: { type: 'boolean' }, output: { type: 'string' } }, required: ['passed', 'output'] } }
  ),
  () => agent(
    `Run ./gradlew test in ${ROOT}. Return { passed: boolean, total: number, failed: number, failures: [] }.`,
    { label: 'final-unit-tests', schema: { type: 'object', properties: { passed: { type: 'boolean' }, total: { type: 'number' }, failed: { type: 'number' }, failures: { type: 'array', items: { type: 'string' } } }, required: ['passed', 'total', 'failed', 'failures'] } }
  ),
])

const itest = await agent(
  `Run ./gradlew integrationTest in ${ROOT}. If Docker is unavailable say so. Return { passed: boolean, skipped: boolean, reason: string }.`,
  { label: 'final-integration-tests', schema: { type: 'object', properties: { passed: { type: 'boolean' }, skipped: { type: 'boolean' }, reason: { type: 'string' } }, required: ['passed', 'skipped', 'reason'] } }
)

const allGreen = build.passed && unitTests.passed && (itest.passed || itest.skipped)
const warnings = review.issues.filter(i => i.severity !== 'critical' && i.severity !== 'high')

// ─── Phase 11: Frontend ───────────────────────────────────────────────────────
phase('Frontend')

const frontendResult = await agent(
  `You are a senior React engineer working on the Task Manager frontend.
Project root: ${ROOT}
Frontend directory: ${ROOT}/frontend

You have just had the following backend feature delivered:
Feature spec: "${featureSpec}"
New entities: ${JSON.stringify(analysis.newEntities.map(e => e.name))}
New endpoints: ${JSON.stringify(plan.endpointPlans.map(e => e.method + ' ' + e.path))}

Steps:
1. Check whether ${ROOT}/frontend exists.
   - If NOT: scaffold it with Vite + React 18 + TypeScript + Tailwind + TanStack Query + React Router.
     Run: cd ${ROOT} && npm create vite@latest frontend -- --template react-ts
     Then: cd frontend && npm install && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p && npm install @tanstack/react-query react-router-dom
     Add Vite proxy in vite.config.ts: /api → http://localhost:8080
   - If YES: read existing src/types/, src/api/, src/hooks/, src/pages/ to understand current state.

2. Read the new Java DTO records in ${ROOT}/src/main/java/ and add/update TypeScript interfaces
   in frontend/src/types/ mirroring them exactly (Long→number, String→string, enums→string unions).

3. Add/update API wrapper functions in frontend/src/api/ for each new endpoint.
   Always use the /api proxy prefix — never hardcode http://localhost:8080.

4. Add/update TanStack Query hooks in frontend/src/hooks/ (useQuery for reads, useMutation for writes).
   Mutations must invalidate the relevant query keys on success.

5. Add/update page component(s) in frontend/src/pages/ for the new feature.
   Use Tailwind for styling. Design quality must be professional — proper spacing, colour, typography.
   Wire up hooks. Handle loading, error, and empty states.

6. Run: cd ${ROOT}/frontend && npm run build
   Fix all TypeScript errors before finishing.

Return { scaffolded: boolean, typesUpdated: string[], apisAdded: string[], hooksAdded: string[], pagesUpdated: string[], buildPassed: boolean }`,
  {
    label: 'frontend-sync',
    agentType: 'react-engineer',
    schema: {
      type: 'object',
      properties: {
        scaffolded:    { type: 'boolean' },
        typesUpdated:  { type: 'array', items: { type: 'string' } },
        apisAdded:     { type: 'array', items: { type: 'string' } },
        hooksAdded:    { type: 'array', items: { type: 'string' } },
        pagesUpdated:  { type: 'array', items: { type: 'string' } },
        buildPassed:   { type: 'boolean' },
      },
      required: ['scaffolded', 'typesUpdated', 'apisAdded', 'hooksAdded', 'pagesUpdated', 'buildPassed']
    }
  }
)

log(`Frontend: scaffolded=${frontendResult.scaffolded}, build=${frontendResult.buildPassed ? 'PASSED' : 'FAILED'}, pages=${frontendResult.pagesUpdated.join(', ')}`)

return {
  shipReady:             allGreen && frontendResult.buildPassed,
  feature:               featureSpec,
  entitiesCreated:       analysis.newEntities.map(e => e.name),
  endpointsShipped:      plan.endpointPlans.map(e => e.method + ' ' + e.path),
  build:                 build.passed ? 'PASSED' : 'FAILED',
  unitTests:             (unitTests.total - unitTests.failed) + '/' + unitTests.total + ' passed',
  integrationTests:      itest.skipped ? 'SKIPPED (' + itest.reason + ')' : (itest.passed ? 'PASSED' : 'FAILED'),
  securityBlockersFixed: securityBlockers.length,
  reviewBlockersFixed:   reviewBlockers.length,
  warnings:              warnings,
  frontend: {
    scaffolded:   frontendResult.scaffolded,
    buildPassed:  frontendResult.buildPassed,
    types:        frontendResult.typesUpdated,
    apis:         frontendResult.apisAdded,
    hooks:        frontendResult.hooksAdded,
    pages:        frontendResult.pagesUpdated,
  },
}
