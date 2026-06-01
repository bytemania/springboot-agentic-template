export const meta = {
  name: 'new-endpoint',
  description: 'Scaffold a complete REST endpoint: plan → implement → test → verify',
  phases: [
    { title: 'Plan', detail: 'Analyse existing code and produce implementation plan' },
    { title: 'Implement', detail: 'Generate all layers of the endpoint slice' },
    { title: 'Verify', detail: 'Run tests to confirm everything passes' },
  ],
}

// args should be a plain-English description of the endpoint, e.g.:
// "POST /tasks — create a task with title (required, max 255), priority (LOW/MEDIUM/HIGH, default MEDIUM)"
const spec = args || 'Describe the endpoint you want to build'

phase('Plan')

const plan = await agent(`You are a Spring Boot architect. Analyse the project at /Users/sergio/CoworkSandbox/springboot-agentic-template.
Read CLAUDE.md, then glob src/main/java/**/*.java to understand existing code.
Based on this endpoint spec: "${spec}"
Produce a structured implementation plan with: HTTP method, path, request DTO fields, response DTO fields, service method signature, domain changes, exceptions, and test scenarios.
Return as { method, path, requestDto, responseDto, serviceMethod, domainChange, exceptions, testScenarios }.`, {
  label: 'plan',
  schema: {
    type: 'object',
    properties: {
      method: { type: 'string' },
      path: { type: 'string' },
      requestDto: { type: 'string' },
      responseDto: { type: 'string' },
      serviceMethod: { type: 'string' },
      domainChange: { type: 'string' },
      exceptions: { type: 'string' },
      testScenarios: { type: 'array', items: { type: 'string' } }
    },
    required: ['method', 'path', 'requestDto', 'responseDto', 'serviceMethod', 'domainChange', 'exceptions', 'testScenarios']
  }
})

log(`Plan: ${plan.method} ${plan.path}`)

phase('Implement')

await agent(`You are a senior Java backend engineer. Implement this endpoint in the Spring Boot project at /Users/sergio/CoworkSandbox/springboot-agentic-template.
Read CLAUDE.md first. Follow the layered architecture strictly.
Endpoint spec: "${spec}"
Implementation plan: ${JSON.stringify(plan, null, 2)}
Implement in order: domain → request DTO → response DTO → service → controller → exception handling → tests.
Run ./gradlew test at the end and confirm it passes.`, {
  label: 'implement',
  agentType: 'backend-engineer'
})

phase('Verify')

const result = await agent('Run ./gradlew test and report whether all tests pass. Return { passed: boolean, summary: string }.', {
  label: 'verify',
  schema: { type: 'object', properties: { passed: { type: 'boolean' }, summary: { type: 'string' } }, required: ['passed', 'summary'] }
})

return {
  endpoint: `${plan.method} ${plan.path}`,
  testsPassed: result.passed,
  summary: result.summary,
}
