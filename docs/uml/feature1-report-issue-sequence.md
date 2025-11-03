### Feature 1: Report an Issue - Sequence Diagram

```mermaid
sequenceDiagram
  actor User
  participant Page as BookRoom Page (Client)
  participant Modal as ReportIssueModal
  participant API as Next.js API /api/issues
  participant Prisma as Prisma Client
  participant DB as SQLite

  User->>Page: Click "Report issue"
  Page->>Modal: open()
  activate Modal
  User->>Modal: Fill form + Submit
  Modal->>Modal: validateForm()

  alt Invalid form
    Modal-->>User: Show validation errors
  else Valid form
    Modal->>API: POST /api/issues {issueType, description, email?, bookingId?, roomId?}
    activate API
    API->>API: Zod.validate(body)

    alt Zod validation error
      API-->>Modal: 400 {error}
      Modal-->>User: Show error (invalid input)
    else Valid body
      API->>Prisma: issue.create(data)
      activate Prisma
      Prisma->>DB: INSERT Issue
      DB-->>Prisma: OK (id)
      deactivate Prisma
      API-->>Modal: 201 {id}
      Modal->>Page: onSuccess(id)
      Page-->>User: Success toast + close modal
    end
    deactivate API
  end

  opt User retries submit
    User->>Modal: Fix input and re-submit
  end
  deactivate Modal
```
