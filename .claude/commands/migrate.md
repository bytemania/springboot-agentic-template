Apply pending Flyway migrations.

```bash
./gradlew flywayMigrate
```

Report: which migrations were applied (version + description). If migration fails, show the failed script name and the SQL error. Do not attempt to fix the migration — just report what failed.
