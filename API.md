# API permissions

All endpoints are served by the Express application. Unless stated otherwise, JSON errors are returned for API failures.

| Method and path | Who may call it | Purpose |
|---|---|---|
| POST /api/auth/register | Public | Register a normal owner account |
| POST /api/auth/login | Public | Authenticate and create a session |
| GET /api/auth/me | Signed-in user | Return the current session user |
| POST /api/auth/logout | Signed-in user | End the session |
| GET /api/health | Public | Check database connectivity |
| GET /api/documents | Signed-in user | List/search only documents the user owns, administers, or has been shared with |
| POST /api/documents/upload | Signed-in user | Upload a validated document |
| GET /api/documents/:id/download | Owner, admin, or user with read/edit share | Download a permitted document |
| GET /api/documents/:id/shares | Owner or admin | List users who have access |
| POST /api/documents/:id/share | Owner or admin | Grant read/edit permission to a registered user |
| DELETE /api/documents/:id/share/:userId | Owner or admin | Revoke a user's share |
| DELETE /api/documents/:id | Owner or admin | Delete a document |
| GET /api/admin/stats | Admin | View aggregate counts and recent audit activity |

## Authorization rule

Never trust a document ID or a UI control as proof of permission. The server must load the document using the current session user and check ownership, administrator status, or the matching share record before returning file data or changing a document.

## Verification still required

Run the application with a real PostgreSQL database and two or more accounts. Try direct API requests as an unrelated user, not only buttons in the browser. Confirm denied requests return 401/403/404 and do not disclose document contents.
