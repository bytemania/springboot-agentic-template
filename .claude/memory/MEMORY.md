# Project Memory Index

Claude Code loads this index at the start of every session. Each entry is a pointer to a memory file.
Keep entries under 150 characters. Write memory content in the linked files, not here.

## Entries

- [Architecture Decisions](architecture-decisions.md) — Why the layered architecture, Flyway, H2/PG split, slide-in panels, and Logstash port were chosen
- [Known Gotchas](known-gotchas.md) — Flyway 10 module split, macOS port 5000 conflict, Docker jar glob, Spotless formatting gate
- [Conventions](conventions.md) — Commit style, test naming, DTO rules, no Lombok, transaction placement, metric naming
- [Infrastructure Notes](infra-notes.md) — Port map, env vars, service dependency order, Docker memory requirements
