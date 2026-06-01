---
name: jpa
description: >
  Use this skill to add or modify JPA entities, Spring Data repositories, and JPQL/native queries.
  Invoke when creating a new domain entity, adding a repository method, mapping relationships,
  or optimizing a query. Always pairs with the flyway skill for schema changes.
---

# Skill: jpa

Adds or modifies JPA entities and repositories following the project's conventions.
Schema changes always go through Flyway — never rely on `ddl-auto`.

---

## Step 1 — Confirm requirements

Before writing any code, confirm:

- Entity name and table name
- Fields, types, constraints (nullable, unique, length)
- Relationships (`@OneToMany`, `@ManyToOne`, etc.) and ownership side
- Whether a new Flyway migration is needed (almost always yes)
- Any custom queries needed beyond Spring Data method names

---

## Step 2 — Inspect what exists

```
Glob  → src/main/java/**/*.java          (find existing entities and repos)
Grep  → @Entity                          (existing entities)
Grep  → JpaRepository                   (existing repositories)
LS    → src/main/resources/db/migration (existing Flyway scripts — note latest version)
```

---

## Step 3 — Plan

Write out before implementing:

```
Entity       : [ClassName] → table [table_name]
Fields       : [field list with types and constraints]
Relationships: [type, target, cascade, fetch]
Repository   : [interface name] extends JpaRepository<X, Long>
Custom query : [method name or @Query — only if needed]
Migration    : V{next}__{description}.sql
```

---

## Step 4 — Implement

### 4a. Domain entity

```java
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    // always provide a no-arg constructor for JPA
    protected Task() {}

    public Task(String title) {
        this.title = title;
    }

    // getters only — no setters on core fields; use domain methods
}
```

Rules:
- Use `Long` for IDs, `GenerationType.IDENTITY`
- `@Column` on every field that has a constraint
- No public setters — add domain methods (`complete()`, `rename()`) if state needs to change
- No Lombok
- No `@Data` — implement `equals`/`hashCode` on `id` if needed

### 4b. Repository

```java
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatus(TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.assignee.id = :userId ORDER BY t.createdAt DESC")
    List<Task> findByAssigneeOrderedByDate(@Param("userId") Long userId);
}
```

Rules:
- Extend `JpaRepository<T, ID>` — don't extend `CrudRepository` or `PagingAndSortingRepository` unless you need paging
- Use Spring Data method name derivation when the query is simple
- Use `@Query` for anything that would produce a confusing method name
- Never use native SQL unless there is no JPQL alternative

### 4c. Flyway migration (always)

Create `src/main/resources/db/migration/V{next}__{snake_case_description}.sql`:

```sql
CREATE TABLE tasks (
    id         BIGSERIAL PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    status     VARCHAR(50)  NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

Rules:
- Use `BIGSERIAL` for auto-increment PK (PostgreSQL compatible)
- H2 accepts `BIGSERIAL` in compatibility mode — no separate H2 script needed
- Always include `NOT NULL` constraints to match entity annotations
- Do not use `ALTER TABLE` in new-table migrations; put everything in the `CREATE TABLE`

---

## Step 5 — Test

### Repository slice test (`@DataJpaTest`)

```java
@DataJpaTest
class TaskRepositoryTest {

    @Autowired TaskRepository repository;

    @Test
    void save_and_findById() {
        Task saved = repository.save(new Task("Buy milk"));
        assertThat(repository.findById(saved.getId())).isPresent();
    }

    @Test
    void findByStatus_returnsMatchingTasks() {
        repository.save(new Task("A")); // default status OPEN
        List<Task> open = repository.findByStatus(TaskStatus.OPEN);
        assertThat(open).hasSize(1);
    }
}
```

Rules:
- `@DataJpaTest` uses H2 automatically — no extra config
- Flyway runs against H2 in test — migration SQL must be H2-compatible
- Test every custom query method
- Use `assertThat` (AssertJ) — never `assertTrue`/`assertEquals`

---

## Step 6 — Verify

```bash
./gradlew test
```

All tests must pass. If Flyway fails, check the migration SQL for H2 compatibility.

---

## Output summary

```
## Entity / Repository added
[ClassName] → [table_name]

## Files created or modified
- [file path] — what changed

## Migration
V{version}__{description}.sql — what schema change was made

## Tests
- [test class] — scenarios covered

## Verify
./gradlew test — PASSED
```
