# Task Manager API Reference

Base URL (local dev): `http://localhost:8080`

All request and response bodies are `application/json`.

---

## Enumerations

### TaskStatus

| Value | Description |
|---|---|
| `TODO` | Not yet started |
| `IN_PROGRESS` | Actively being worked on |
| `DONE` | Completed |
| `CANCELLED` | Cancelled and no longer relevant |

### TaskPriority

| Value | Description |
|---|---|
| `LOW` | Can wait |
| `MEDIUM` | Default priority |
| `HIGH` | Should be done soon |
| `URGENT` | Needs immediate attention |

---

## Task Object

```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-06-15",
  "createdAt": "2026-06-01T20:00:00",
  "updatedAt": "2026-06-01T20:00:00",
  "tags": ["personal", "shopping"]
}
```

---

## Endpoints

### GET /tasks

List all tasks. Supports optional filtering by status and/or priority.

**Query parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | TaskStatus | No | Filter by status |
| `priority` | TaskPriority | No | Filter by priority |

**Response** `200 OK` — array of Task objects

```bash
# All tasks
curl http://localhost:8080/tasks | jq .

# Filter by status
curl "http://localhost:8080/tasks?status=IN_PROGRESS" | jq .

# Filter by status and priority
curl "http://localhost:8080/tasks?status=TODO&priority=URGENT" | jq .
```

---

### GET /tasks/{id}

Fetch a single task by ID.

**Response**

| Status | Body | When |
|---|---|---|
| `200 OK` | Task object | Found |
| `404 Not Found` | Error object | No task with that ID |

```bash
curl http://localhost:8080/tasks/1 | jq .
```

---

### POST /tasks

Create a new task.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | 1–255 characters |
| `description` | string | No | Free text |
| `priority` | TaskPriority | No | Defaults to `MEDIUM` |
| `dueDate` | date (`YYYY-MM-DD`) | No | |

**Response**

| Status | Body | When |
|---|---|---|
| `201 Created` | Task object | Created — includes `Location` header |
| `400 Bad Request` | Error object | Validation failure |

```bash
curl -s -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy to prod","priority":"URGENT","dueDate":"2026-06-10"}' | jq .
```

---

### PATCH /tasks/{id}

Partial update — only fields provided in the body are changed. Null/missing fields are ignored.

**Request body** (all fields optional)

| Field | Type | Description |
|---|---|---|
| `title` | string | New title (max 255 chars) |
| `description` | string | New description |
| `status` | TaskStatus | New status |
| `priority` | TaskPriority | New priority |
| `dueDate` | date | New due date |

**Response**

| Status | Body | When |
|---|---|---|
| `200 OK` | Updated task | Updated |
| `404 Not Found` | Error object | Task not found |

```bash
curl -s -X PATCH http://localhost:8080/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS","priority":"HIGH"}' | jq .
```

---

### PUT /tasks/{id}

Full replace — replaces title, description, priority, and dueDate. Status is reset to `TODO`.

**Request body** — same shape as `POST /tasks` (title required)

**Response**

| Status | Body | When |
|---|---|---|
| `200 OK` | Replaced task | Updated |
| `404 Not Found` | Error object | Task not found |
| `400 Bad Request` | Error object | Validation failure |

```bash
curl -s -X PUT http://localhost:8080/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Rewritten task","priority":"MEDIUM"}' | jq .
```

---

### PATCH /tasks/{id}/status

Update only the status of a task.

**Request body**

| Field | Type | Required |
|---|---|---|
| `status` | TaskStatus | Yes |

**Response**

| Status | Body | When |
|---|---|---|
| `200 OK` | Updated task | Updated |
| `400 Bad Request` | Error object | Missing or invalid status |
| `404 Not Found` | Error object | Task not found |

```bash
curl -s -X PATCH http://localhost:8080/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"CANCELLED"}' | jq .
```

---

### DELETE /tasks/{id}

Delete a task permanently.

**Response**

| Status | Body | When |
|---|---|---|
| `204 No Content` | — | Deleted |
| `404 Not Found` | Error object | Task not found |

```bash
curl -s -X DELETE http://localhost:8080/tasks/1 -w "%{http_code}"
```

---

### POST /tasks/{id}/tags

Add a tag to a task.

**Request body**

| Field | Type | Required |
|---|---|---|
| `tag` | string | Yes (non-blank, max 50 chars) |

**Response** `200 OK` — updated task with tag included

```bash
curl -s -X POST http://localhost:8080/tasks/1/tags \
  -H "Content-Type: application/json" \
  -d '{"tag":"backend"}' | jq .tags
```

---

### DELETE /tasks/{id}/tags/{tag}

Remove a tag from a task.

**Response** `200 OK` — updated task with tag removed

```bash
curl -s -X DELETE http://localhost:8080/tasks/1/tags/backend | jq .tags
```

---

## Error Response

All error responses follow this shape:

```json
{
  "timestamp": "2026-06-01T20:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Task not found with id: 99",
  "path": "/tasks/99"
}
```

| Status | Cause |
|---|---|
| `400` | Validation failure — `message` lists the failing fields |
| `404` | Task not found |
| `500` | Unexpected server error |
