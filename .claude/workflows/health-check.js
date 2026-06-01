export const meta = {
  name: 'health-check',
  description: 'Audit project health across build, tests, code quality, migrations, and observability',
  phases: [
    { title: 'Scan', detail: 'Run parallel checks across all dimensions' },
    { title: 'Report', detail: 'Synthesize findings into a health report' },
  ],
}

phase('Scan')

const CHECKS = [
  {
    key: 'build',
    prompt: 'Run ./gradlew clean build in /Users/sergio/CoworkSandbox/springboot-agentic-template. Return { passed: boolean, errors: string[] }.',
    schema: { type: 'object', properties: { passed: { type: 'boolean' }, errors: { type: 'array', items: { type: 'string' } } }, required: ['passed', 'errors'] }
  },
  {
    key: 'tests',
    prompt: 'Run ./gradlew test in /Users/sergio/CoworkSandbox/springboot-agentic-template. Return { passed: boolean, total: number, failed: number, failures: string[] }.',
    schema: { type: 'object', properties: { passed: { type: 'boolean' }, total: { type: 'number' }, failed: { type: 'number' }, failures: { type: 'array', items: { type: 'string' } } }, required: ['passed', 'total', 'failed', 'failures'] }
  },
  {
    key: 'migrations',
    prompt: 'In /Users/sergio/CoworkSandbox/springboot-agentic-template, check src/main/resources/db/migration/. List all migration files. Check that each @Entity class has a corresponding migration. Return { migrationCount: number, files: string[], missingMigrations: string[] }.',
    schema: { type: 'object', properties: { migrationCount: { type: 'number' }, files: { type: 'array', items: { type: 'string' } }, missingMigrations: { type: 'array', items: { type: 'string' } } }, required: ['migrationCount', 'files', 'missingMigrations'] }
  },
  {
    key: 'observability',
    prompt: 'In /Users/sergio/CoworkSandbox/springboot-agentic-template, check if: (1) actuator is on classpath in build.gradle, (2) prometheus endpoint is configured in application.properties, (3) any service uses MeterRegistry or @Timed. Return { actuatorPresent: boolean, prometheusConfigured: boolean, metricsInstrumented: boolean, gaps: string[] }.',
    schema: { type: 'object', properties: { actuatorPresent: { type: 'boolean' }, prometheusConfigured: { type: 'boolean' }, metricsInstrumented: { type: 'boolean' }, gaps: { type: 'array', items: { type: 'string' } } }, required: ['actuatorPresent', 'prometheusConfigured', 'metricsInstrumented', 'gaps'] }
  },
  {
    key: 'coverage',
    prompt: 'In /Users/sergio/CoworkSandbox/springboot-agentic-template, list all service classes (files ending in *Service.java in src/main/java). For each, check if a corresponding *ServiceTest.java or *Service*Test.java exists in src/test/java. Return { services: string[], untested: string[] }.',
    schema: { type: 'object', properties: { services: { type: 'array', items: { type: 'string' } }, untested: { type: 'array', items: { type: 'string' } } }, required: ['services', 'untested'] }
  },
]

const results = await parallel(CHECKS.map(c => () => agent(c.prompt, { label: c.key, phase: 'Scan', schema: c.schema })))

const [build, tests, migrations, observability, coverage] = results

phase('Report')

return {
  healthy: build.passed && tests.passed && migrations.missingMigrations.length === 0,
  build: build.passed ? 'PASSED' : `FAILED: ${build.errors.join(', ')}`,
  tests: tests.passed ? `PASSED (${tests.total} tests)` : `FAILED (${tests.failed} failures)`,
  migrations: migrations.missingMigrations.length === 0 ? `OK (${migrations.migrationCount} migrations)` : `GAPS: ${migrations.missingMigrations.join(', ')}`,
  observability: observability.gaps.length === 0 ? 'OK' : `GAPS: ${observability.gaps.join(', ')}`,
  untestedServices: coverage.untested,
}
