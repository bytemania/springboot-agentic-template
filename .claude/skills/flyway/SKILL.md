---
name: flyway
description: >
  Use this skill to create or modify a Flyway database migration.
  Invoke when a schema change is needed: new table, new column, index, constraint, rename.
  Never modify an already-applied migration — always create a new one.
---

# Skill: flyway

Creates safe, idempotent Flyway migrations for the Task Manager schema.
Flyway owns the schema — never use `ddl-auto=create` or `ddl-auto=update`.

---

## Step 1 — Understand the change

Confirm:

- What schema change is needed (new table, new column, drop column, index, rename)
- Which existing tables/columns are affected
- Whether there is data that must be preserved or migrated

---

## Step 2 — Check existing migrations

```
LS    → src/main/resources/db/migration   (list all V*.sql files, note latest version)
Read  → latest migration file             (understand current schema state)
```

Determine the next version number: if latest is `V3__...`, use `V4`.

---

## Step 3 — Write the migration

File: `src/main/resources/db/migration/V{version}__{snake_case_description}.sql`

### New table

```sql
CREATE TABLE tasks (
    id          BIGSERIAL    PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50)  NOT NULL DEFAULT 'OPEN',
    priority    VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks (status);
```

### Add column

```sql
ALTER TABLE tasks ADD COLUMN assignee_id BIGINT REFERENCES users(id);
```

### Add index

```sql
CREATE INDEX idx_tasks_assignee ON tasks (assignee_id);
```

### Rename column (PostgreSQL)

```sql
ALTER TABLE tasks RENAME COLUMN due_date TO deadline;
```

### Drop column

```sql
ALTER TABLE tasks DROP COLUMN IF EXISTS legacy_field;
```

---

## Rules

- **Never modify** a migration that has already been applied (`V1__`, `V2__`, etc.)
- **Always use** `BIGSERIAL` for new auto-increment PKs (PostgreSQL + H2 compatible)
- **Never use** `ddl-auto=create` or `ddl-auto=update` — Flyway is the only schema manager
- **Write forward-only** migrations — no rollback scripts
- **H2 compatibility**: H2 supports most PostgreSQL DDL in default mode. Avoid: `GENERATED ALWAYS AS IDENTITY`, `CONCURRENT` indexes, PostgreSQL-specific types like `JSONB`
- **Naming**: `V{integer}__{lower_snake_case}.sql` — double underscore separates version from description
- Every `NOT NULL` column added to an existing table must have a `DEFAULT` or the migration will fail on non-empty tables

---

## Step 4 — Verify locally

```bash
./gradlew flywayMigrate
./gradlew test
```

If `flywayMigrate` fails, the SQL is either invalid or version-conflicted.
If tests fail after migration, check that the entity annotations match the new schema.

---

## Output summary

```
## Migration created
V{version}__{description}.sql

## Schema change
[what was added/modified/removed]

## H2 compatibility
[confirmed / note any workarounds]

## Verify
./gradlew test — PASSED
```
