Run the integration test suite. Requires Docker to be running (Testcontainers spins up a PostgreSQL container).

```bash
./gradlew integrationTest
```

If Docker is not running, say so clearly and stop. Do not attempt to start Docker.

Report: total tests, passed, failed, skipped. If any tests fail, show the failing test name and the error.
