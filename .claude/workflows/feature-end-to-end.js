export const meta = {
  name: 'feature-end-to-end',
  description: 'Full end-to-end feature delivery: requirements → plan → migrate → implement → test → review → ship',
  phases: [
    { title: 'Analyse', detail: 'Read the codebase and clarify the feature spec' },
    { title: 'Plan', detail: 'Produce a detailed implementation plan for every layer' },
    { title: 'Migrate', detail: 'Write and apply the Flyway schema migration' },
    { title: 'Implement', detail: 'Generate domain, DTOs, repository, service, controller, exception handling' },
    { title: 'Test', detail: 'Generate and run unit + integration tests' },
    { title: 'Review', detail: 'Code-review the full diff for correctness and Spring Boot best-practices' },
    { title: 'Ship', detail: 'Final build + full test suite gate' },
  ],
}

// Pass a plain-English feature description as args, e.g.:
// "Task CRUD: create, read, update, delete, list with filtering by status"
const featureSpec = args || 'Describe the feature you want to build end-to-end'

// ─── Phase 1: Analyse ────────────────────────────────────────────────────────
phase('Analyse')

const analysis = await agent(`You are a senior Spring Boot architect.
Project root: /Users/sergio/CoworkSandbox/springboot-agentic-template
1. Read CLAUDE.md for architecture rules.
2. Glob src/main/java/**/*.java to catalogue every existing entity, repository, service, and controller.
3. Glob src/main/resources/db/migration/**/*.sql to understand the current schema.
4. Based on the feature spec below, identify:
   - New or modified domain entities and their fields (name, Java type, JPA constraints)
   - New API endpoints (method + path + one-line purpose)
   - Business invariants that must be enforced in the service layer
   - Error conditions each endpoint must handle
Feature spec: "${featureSpec}"
Return { existingEntities: string[], newEntities: Array<{name,fields:string[]}>, endpoints: Array<{method,path,purpose}>, businessRules: string[], errorCases: string[] }`, {
  label: 'analyse',
  schema: {
    type: 'object',
    properties: {
      existingEntities: { type: 'array', items: { type: 'string' } },
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
      errorCases: { type: 'array', items: { type: 'string' } },
    },
    required: ['existingEntities', 'newEntities', 'endpoints', 'businessRules', 'errorCases']
  }
})

log(`Found ${analysis.existingEntities.length} existing entities, planning ${analysis.newEntities.length} new entities across ${analysis.endpoints.length} endpoints`)

// ─── Phase 2: Plan ───────────────────────────────────────────────────────────
phase('Plan')

const plan = await agent(`You are a Spring Boot architect.
Project root: /Users/sergio/CoworkSandbox/springboot-agentic-template
Feature spec: "${featureSpec}"
Analysis result: ${JSON.stringify(analysis, null, 2)}

Produce a concrete implementation plan covering every layer. For each endpoint list:
- Request DTO record fields with @Valid annotations
- Response DTO record fields
- Service method signature
- Repository query method (if custom finder is needed)
- Exception class name and HTTP status
- 3 unit test scenario names
- 2 integration test scenario names

Also list every Flyway migration file needed (filename + SQL summary).

Return {
  migrationFiles: Array<{filename: string, sqlSummary: string}>,
  endpointPlans: Array<{
    method: string, path: string,
    requestDto: string, responseDto: string,
    serviceMethod: string, repositoryQuery: string,
    exceptionClass: string, httpStatus: number,
    unitTests: string[], integrationTests: string[]
  }>
}`, {
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
            method: { type: 'string' }, path: { type: 'string' },
            requestDto: { type: 'string' }, responseDto: { type: 'string' },
            serviceMethod: { type: 'string' }, repositoryQuery: { type: 'string' },
            exceptionClass: { type: 'string' }, httpStatus: { type: 'number' },
            unitTests: { type: 'array', items: { type: 'string' } },
            integrationTests: { type: 'array', items: { type: 'string' } }
          },
          required: ['method', 'path', 'requestDto', 'responseDto', 'serviceMethod',
                     'repositoryQuery', 'exceptionClass', 'httpStatus', 'unitTests', 'integrationTests']
        }
      }
    },
    required: ['migrationFiles', 'endpointPlans']
  }
})

log(`Plan covers ${plan.migrationFiles.length} migration(s) and ${plan.endpointPlans.length} endpoint(s)`)

// ─── Phase 3: Migrate ────────────────────────────────────────────────────────
phase('Migrate')

await agent(`You are a senior Java backend engineer.
Project root: /Users/sergio/CoworkSandbox/springboot-agentic-template
Write the following Flyway migration SQL files under src/main/resources/db/migration/.
Migration plan: ${JSON.stringify(plan.migrationFiles, null, 2)}
Rules:
- Use standard Flyway naming: V<next_version>__<snake_description>.sql
- Check existing migration files first to pick the next version number.
- Use CREATE TABLE with UUID primary keys (gen_random_uuid()), created_at/updated_at TIMESTAMPTZ DEFAULT NOW(), and appropriate NOT NULL / UNIQUE constraints.
- Do not use Flyway Java migrations.
After writing the files, run ./gradlew flywayValidate (or ./gradlew test if flywayValidate is not configured) to confirm the migration parses without error.`, {
  label: 'migrate',
})

// ─── Phase 4: Implement ──────────────────────────────────────────────────────
phase('Implement')

await agent(`You are a senior Java backend engineer.
Project root: /Users/sergio/CoworkSandbox/springboot-agentic-template
Read CLAUDE.md first. Follow the layered architecture strictly.
Feature spec: "${featureSpec}"
Full plan: ${JSON.stringify(plan, null, 2)}
Analysis: ${JSON.stringify(analysis, null, 2)}

Implement in this exact order:
1. Domain entity / entities (JPA @Entity, no Lombok, constructor injection)
2. JPA Repository interface(s)
3. Request DTO records with @Valid constraints
4. Response DTO records
5. Custom exception classes mapped to the correct HTTP status via @ResponseStatus or @ControllerAdvice
6. Global exception handler in an ErrorResponse record if not already present
7. Service class (constructor-injected, enforces business rules from analysis)
8. Controller class (@RestController, @RequestMapping, no business logic)

Do NOT run tests yet — that happens in the next phase.`, {
  label: 'implement',
  agentType: 'backend-engineer',
})

// ─── Phase 5: Test ───────────────────────────────────────────────────────────
phase('Test')

await agent(`You are a senior Java backend engineer specialising in testing.
Project root: /Users/sergio/CoworkSandbox/springboot-agentic-template
Read CLAUDE.md first.
Feature spec: "${featureSpec}"
Test scenarios to cover: ${JSON.stringify(plan.endpointPlans.flatMap(e => [...e.unitTests, ...e.integrationTests]), null, 2)}

Write tests in this order:
1. Unit tests under src/test/java/... — use @ExtendWith(MockitoExtension.class), Mockito, and AssertJ. Cover service-layer business rules and happy paths.
2. Integration tests under src/integrationTest/java/... — use @SpringBootTest + MockMvc (H2 for speed, or Testcontainers PostgreSQL if the test requires real SQL). Cover full HTTP → DB → HTTP response cycles.

After writing tests, run ./gradlew test and then ./gradlew integrationTest.
Report whether all tests pass. Fix any compilation or test failures before declaring done.`, {
  label: 'test',
  agentType: 'backend-engineer',
})

// ─── Phase 6: Review ─────────────────────────────────────────────────────────
phase('Review')

const review = await agent(`You are a senior Spring Boot code reviewer.
Run: git diff HEAD in /Users/sergio/CoworkSandbox/springboot-agentic-template
Review the diff for:
- Correctness bugs (null handling, missing validation, wrong HTTP status codes)
- Business rule gaps (are all invariants from the spec enforced?)
- Spring Boot anti-patterns (logic in controller, missing @Transactional, field injection)
- Security basics (no sensitive data in responses, input sanitised)
- Missing or insufficient tests
- Observability gaps (are Micrometer counters/timers wired for key business events?)
Return { issues: Array<{severity: 'critical'|'high'|'medium'|'low', file: string, finding: string}>, approved: boolean }`, {
  label: 'review',
  schema: {
    type: 'object',
    properties: {
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            file: { type: 'string' },
            finding: { type: 'string' }
          },
          required: ['severity', 'file', 'finding']
        }
      },
      approved: { type: 'boolean' }
    },
    required: ['issues', 'approved']
  }
})

const blockers = review.issues.filter(i => i.severity === 'critical' || i.severity === 'high')

if (blockers.length > 0) {
  log(`Review found ${blockers.length} blocker(s) — auto-fixing before ship gate`)
  await agent(`You are a senior Java backend engineer.
Project root: /Users/sergio/CoworkSandbox/springboot-agentic-template
Fix the following review findings (critical + high severity only):
${JSON.stringify(blockers, null, 2)}
After fixing, run ./gradlew test to confirm no regressions.`, {
    label: 'fix-review-findings',
    agentType: 'backend-engineer',
  })
}

// ─── Phase 7: Ship ───────────────────────────────────────────────────────────
phase('Ship')

const [build, unitTests] = await parallel([
  () => agent('Run ./gradlew clean build in /Users/sergio/CoworkSandbox/springboot-agentic-template. Return { passed: boolean, output: string }.', {
    label: 'final-build',
    schema: { type: 'object', properties: { passed: { type: 'boolean' }, output: { type: 'string' } }, required: ['passed', 'output'] }
  }),
  () => agent('Run ./gradlew test in /Users/sergio/CoworkSandbox/springboot-agentic-template. Return { passed: boolean, total: number, failed: number, failures: string[] }.', {
    label: 'final-unit-tests',
    schema: { type: 'object', properties: { passed: { type: 'boolean' }, total: { type: 'number' }, failed: { type: 'number' }, failures: { type: 'array', items: { type: 'string' } } }, required: ['passed', 'total', 'failed', 'failures'] }
  }),
])

const itest = await agent('Run ./gradlew integrationTest in /Users/sergio/CoworkSandbox/springboot-agentic-template. If Docker is unavailable say so. Return { passed: boolean, skipped: boolean, reason: string }.', {
  label: 'final-integration-tests',
  schema: { type: 'object', properties: { passed: { type: 'boolean' }, skipped: { type: 'boolean' }, reason: { type: 'string' } }, required: ['passed', 'skipped', 'reason'] }
})

const allGreen = build.passed && unitTests.passed && (itest.passed || itest.skipped)
const remainingWarnings = review.issues.filter(i => i.severity !== 'critical' && i.severity !== 'high')

return {
  shipReady: allGreen && blockers.length === 0,
  feature: featureSpec,
  entitiesCreated: analysis.newEntities.map(e => e.name),
  endpointsShipped: plan.endpointPlans.map(e => `${e.method} ${e.path}`),
  build: build.passed ? 'PASSED' : 'FAILED',
  unitTests: `${unitTests.total - unitTests.failed}/${unitTests.total} passed`,
  integrationTests: itest.skipped ? `SKIPPED (${itest.reason})` : (itest.passed ? 'PASSED' : 'FAILED'),
  reviewBlockersFixed: blockers.length,
  warnings: remainingWarnings,
}
