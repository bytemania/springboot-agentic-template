export const meta = {
  name: 'ship-feature',
  description: 'Run full pre-ship checklist: build → unit tests → integration tests → code review',
  phases: [
    { title: 'Verify', detail: 'Build and run all test suites' },
    { title: 'Review', detail: 'Code review the current diff' },
    { title: 'Report', detail: 'Summarize ship readiness' },
  ],
}

phase('Verify')

const [build, unitTests] = await parallel([
  () => agent('Run ./gradlew clean build and report whether it passed or failed. Return { passed: boolean, output: string }.', {
    label: 'build',
    schema: { type: 'object', properties: { passed: { type: 'boolean' }, output: { type: 'string' } }, required: ['passed', 'output'] }
  }),
  () => agent('Run ./gradlew test and report results. Return { passed: boolean, total: number, failed: number, failures: string[] }.', {
    label: 'unit-tests',
    schema: { type: 'object', properties: { passed: { type: 'boolean' }, total: { type: 'number' }, failed: { type: 'number' }, failures: { type: 'array', items: { type: 'string' } } }, required: ['passed', 'total', 'failed', 'failures'] }
  }),
])

const itest = await agent('Run ./gradlew integrationTest. If Docker is not available say so. Return { passed: boolean, skipped: boolean, reason: string }.', {
  label: 'integration-tests',
  schema: { type: 'object', properties: { passed: { type: 'boolean' }, skipped: { type: 'boolean' }, reason: { type: 'string' } }, required: ['passed', 'skipped', 'reason'] }
})

phase('Review')

const review = await agent(`Review the current git diff (run git diff HEAD) for: correctness bugs, missing tests, Spring Boot anti-patterns, security issues.
Be concise. Return { issues: Array<{severity: string, file: string, finding: string}>, approved: boolean }.`, {
  label: 'code-review',
  schema: {
    type: 'object',
    properties: {
      issues: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string' }, file: { type: 'string' }, finding: { type: 'string' } }, required: ['severity', 'file', 'finding'] } },
      approved: { type: 'boolean' }
    },
    required: ['issues', 'approved']
  }
})

phase('Report')

const blockers = review.issues.filter(i => i.severity === 'critical' || i.severity === 'high')
const allTestsPassed = build.passed && unitTests.passed && (itest.passed || itest.skipped)

return {
  shipReady: allTestsPassed && blockers.length === 0,
  build: build.passed ? 'PASSED' : 'FAILED',
  unitTests: `${unitTests.total - unitTests.failed}/${unitTests.total} passed`,
  integrationTests: itest.skipped ? `SKIPPED (${itest.reason})` : (itest.passed ? 'PASSED' : 'FAILED'),
  reviewApproved: review.approved,
  blockers,
  warnings: review.issues.filter(i => i.severity !== 'critical' && i.severity !== 'high'),
}
