# AI assistance and correction log

This file records AI-assisted development for the Snovasys challenge. Review, test, and understand every change before submission.

## Development assistance
- Used ChatGPT to plan a Node.js/Express document-sharing application with PostgreSQL.
- Added authentication, password hashing, session handling, document upload/download, sharing permissions, audit logging, and a browser dashboard.
- Added environment-variable configuration and project setup instructions.

## Errors and corrections
- Earlier server code declared const express more than once, causing "SyntaxError: Identifier 'express' has already been declared". Correction: retain one Express import and one app instance.
- The npm funding notice is informational and is not an installation failure. Continue with npm start.
- The database connection must be provided through DATABASE_URL. The .env file must not be committed.

## Later improvements added
- Added server-side document search by file name or owner.
- Added an API to list users who have access to a document.
- Connected the dashboard to the revoke-access API so owners can revoke sharing.

## Security correction
- Found a privilege-escalation issue: public registration previously assigned the admin role to anyone who registered with the configured ADMIN_EMAIL address. Changed registration so all new public accounts receive the normal owner role.
- Added a separate server-side `npm run make-admin` command to promote the intended existing account. This command must only be run by the project owner from a trusted terminal.

## Verification still required
- Run npm install and npm start.
- Test registration and login with two separate test accounts.
- Test upload (including a renamed or invalid file), download, search, share, revoke, and access denial for an unauthorized account.
- Verify PostgreSQL tables and audit records.
- Test deployment with persistent private file storage and HTTPS.
- Add each new error and its correction below.


## 2026-11-06 — Authorization review of existing sharing code
- Asked AI to compare the existing TrustVault repository with the Snovasys project 695 requirements and identify missing security behavior.
- AI review found that the project had owner/admin checks and read/edit share labels, but the authorization rules were embedded in route handlers and had no focused automated tests.
- Correction: extracted document permission decisions into a small server-side policy module and added Node.js tests for owner, read-share, edit-share, and admin cases.
- Verification: added tests to the repository; run `npm test` and review the GitHub Actions result. These policy tests do not replace end-to-end database/API tests.
- Commit: see the GitHub commit history for the dated authorization-policy and test additions.
