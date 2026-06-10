---
description: "Record an architectural or technical decision into memory and update the relevant documentation"
---

Record a decision made during this session so it persists across future sessions.

Steps:

1. Ask the user (if not already provided):
   - What was decided?
   - Why was it decided? (constraint, tradeoff, stakeholder requirement)
   - Which files or areas of the codebase does it affect?
   - Is this an architectural decision, a known gotcha, a convention, or an infrastructure note?

2. Based on the type, append the decision to the correct memory file:
   - **Architectural decision** → `.claude/memory/architecture-decisions.md`
   - **Known gotcha / trap** → `.claude/memory/known-gotchas.md`
   - **Convention / naming / style** → `.claude/memory/conventions.md`
   - **Infrastructure / port / env var** → `.claude/memory/infra-notes.md`

   Format each entry as:
   ```
   ## <Short title>

   <What was decided — one or two sentences.>
   **Why:** <The reason — constraint, incident, preference.>
   **How to apply:** <When this knowledge is relevant to future work.>
   ```

3. If the entry does not yet exist in `MEMORY.md`, add a one-line pointer:
   - Format: `- [Title](file.md) — one-line hook under 150 chars`

4. If the decision affects the API contract, update `docs/task-manager.md`.

5. If the decision changes architecture rules or conventions, update `CLAUDE.md` in the relevant section.

6. If the decision affects the `.claude/` configuration itself (new agent, command, skill, or workflow), update `docs/claude-configuration.md` in the relevant section.

7. Confirm: "Decision recorded in `.claude/memory/<file>.md` and MEMORY.md updated."
   List every file that was modified.
