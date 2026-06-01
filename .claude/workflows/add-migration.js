export const meta = {
  name: 'add-migration',
  description: 'Create a Flyway migration with matching JPA entity/repository changes and tests',
  phases: [
    { title: 'Analyse', detail: 'Read existing schema and determine next migration version' },
    { title: 'Implement', detail: 'Write migration SQL and update JPA entities/repos' },
    { title: 'Verify', detail: 'Run tests to confirm migration and entities align' },
  ],
}

// args: plain-English description of the schema change, e.g.
// "Add assignee_id FK to tasks table referencing a new users table"
const spec = args || 'Describe the schema change'

phase('Analyse')

const analysis = await agent(`Analyse the Spring Boot project at /Users/sergio/CoworkSandbox/springboot-agentic-template.
List all files in src/main/resources/db/migration/ to find the latest Flyway version number.
List all @Entity classes in src/main/java/ to understand the current domain model.
Schema change requested: "${spec}"
Return { latestVersion: number, nextVersion: number, existingEntities: string[], migrationPlan: string }.`, {
  label: 'analyse-schema',
  schema: {
    type: 'object',
    properties: {
      latestVersion: { type: 'number' },
      nextVersion: { type: 'number' },
      existingEntities: { type: 'array', items: { type: 'string' } },
      migrationPlan: { type: 'string' }
    },
    required: ['latestVersion', 'nextVersion', 'existingEntities', 'migrationPlan']
  }
})

log(`Next migration: V${analysis.nextVersion} — ${analysis.migrationPlan}`)

phase('Implement')

await agent(`You are a database engineer and Spring Boot developer. Implement this schema change in the project at /Users/sergio/CoworkSandbox/springboot-agentic-template.
Read CLAUDE.md and the flyway skill at .claude/skills/flyway/SKILL.md first.
Schema change: "${spec}"
Analysis: ${JSON.stringify(analysis, null, 2)}
Steps:
1. Create src/main/resources/db/migration/V${analysis.nextVersion}__<snake_case_name>.sql
2. Update or create the matching @Entity class(es)
3. Update or create the JpaRepository interface(s)
4. Write a @DataJpaTest for the new query/entity
Run ./gradlew test to confirm.`, {
  label: 'implement-migration',
  agentType: 'database-agent'
})

phase('Verify')

const result = await agent('Run ./gradlew test and report whether all tests pass. Return { passed: boolean, summary: string }.', {
  label: 'verify',
  schema: { type: 'object', properties: { passed: { type: 'boolean' }, summary: { type: 'string' } }, required: ['passed', 'summary'] }
})

return {
  migration: `V${analysis.nextVersion}`,
  plan: analysis.migrationPlan,
  testsPassed: result.passed,
  summary: result.summary,
}
