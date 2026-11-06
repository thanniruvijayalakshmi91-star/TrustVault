# TrustVault — Secure Document Sharing

A Node.js and Express application for private document storage, controlled sharing, and audit tracking.

## Features
- Registration and login with bcrypt password hashing.
- Session-based authentication stored in PostgreSQL.
- Owner and admin roles; documents can be shared with read or edit permission.
- Private document upload and authorized download.
- Grant and revoke document access.
- File type validation and 10 MB upload limit.
- Audit logs for account and document activity.
- Admin overview with user, document, and share counts.

## Requirements
Node.js 18+ and a PostgreSQL database (Neon is supported).

## Run locally
1. Run npm install.
2. Copy .env.example to .env.
3. Add your PostgreSQL connection string to DATABASE_URL.
4. Set SESSION_SECRET to a random value of at least 32 characters.
5. Set ADMIN_EMAIL to the email address that should receive the admin role.
6. Run npm start and open http://localhost:5000.

Database tables are created automatically when the server starts.

## Main API
- POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
- GET /api/documents, POST /api/documents/upload
- GET /api/documents/:id/download, POST /api/documents/:id/share
- DELETE /api/documents/:id/share/:userId, DELETE /api/documents/:id
- GET /api/admin/stats (admin only)
- GET /api/health

## Deployment note
Uploaded files are stored on the server's local disk in a private folder. Before deploying to a host with temporary local storage, configure persistent private object storage. Use HTTPS and secure production cookies. Never commit .env, database URLs, passwords, or session secrets.
