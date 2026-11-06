# TrustVault — Secure Document Sharing

TrustVault is a Node.js and Express web application for storing documents privately, sharing them with registered users, and tracking important activity.

## Features

- User registration and login with bcrypt password hashing.
- PostgreSQL-backed sessions.
- Owner and admin roles; document sharing with read or edit access.
- Private document upload and authorized download.
- Grant, review, and revoke document access.
- Search accessible documents by file name or owner.
- File type checks and a 10 MB upload limit.
- Audit logs for account and document activity.
- Admin dashboard with user, document, share, and recent-activity information.
- Basic automated JavaScript syntax checks through GitHub Actions.

## Technology

- Node.js 18+
- Express 5
- PostgreSQL (Neon supported)
- HTML, CSS, and browser JavaScript

## Run in GitHub Codespaces

1. Open this repository on GitHub.
2. Select **Code → Codespaces → Create codespace on main**.
3. Wait for the VS Code editor to open.
4. Open **Terminal → New Terminal**.
5. Install dependencies:

   ```bash
   npm install
   ```

6. Create a file named `.env` in the repository root. Copy the variable names from `.env.example` and enter your own values:

   ```env
   DATABASE_URL=your_neon_postgresql_connection_string
   SESSION_SECRET=your_random_secret_at_least_32_characters
   NODE_ENV=development
   ADMIN_EMAIL=your_admin_email@example.com
   PORT=5000
   ```

   Keep the real `.env` file private. Never commit it or share its secret values.

7. Run the syntax checks:

   ```bash
   npm test
   ```

8. Start the application:

   ```bash
   npm start
   ```

9. Open the **Ports** tab, find port **5000**, and select **Open in Browser**.

The first server start creates the required PostgreSQL tables. The database must be reachable from Codespaces.

## Local setup

Use Node.js 18 or newer and a PostgreSQL database.

```bash
npm install
```

Create `.env` using the variables shown above, then run:

```bash
npm test
npm start
```

Open http://localhost:5000.

## Main API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/documents?q=search` | List/search accessible documents |
| POST | `/api/documents/upload` | Upload a document |
| GET | `/api/documents/:id/download` | Download an authorized document |
| POST | `/api/documents/:id/share` | Grant read/edit access |
| GET | `/api/documents/:id/shares` | List people with access (owner/admin) |
| DELETE | `/api/documents/:id/share/:userId` | Revoke access |
| DELETE | `/api/documents/:id` | Delete a document |
| GET | `/api/admin/stats` | Admin dashboard data |
| GET | `/api/health` | Check server/database connection |

## Manual test checklist

- [ ] Register a normal account and log in.
- [ ] Register a second account for sharing tests.
- [ ] Upload a valid PDF or image under 10 MB.
- [ ] Try an unsupported file and a renamed invalid file.
- [ ] Search for an uploaded document.
- [ ] Share a document with the second account using read access.
- [ ] Log in as the second account and confirm download works.
- [ ] Confirm the second account cannot delete or share the owner's document.
- [ ] Revoke access and confirm the second account can no longer download it.
- [ ] Test edit permission assignment and document access behavior.
- [ ] Check the admin dashboard using the configured admin account.
- [ ] Confirm audit activity is recorded.

## Important deployment and security notes

- Uploaded files are stored in the server's `private_uploads` directory. A deployment must provide persistent private storage; temporary server filesystems can lose uploads after restart or redeployment.
- Use HTTPS in production and set `NODE_ENV=production`.
- Use a strong, unique `SESSION_SECRET` and a restricted database user.
- Do not commit `.env`, database credentials, session secrets, or uploaded documents.
- File signature checks are basic validation, not malware scanning or a guarantee that a file is safe.
- Run the manual test checklist before submitting. The syntax check alone does not prove that database, browser, upload, or deployment behavior works.
