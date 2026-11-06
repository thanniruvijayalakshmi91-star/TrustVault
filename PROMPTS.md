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

## Verification still required
- Run npm install and npm start.
- Test registration and login with two separate test accounts.
- Test upload, download, share, and access denial for an unauthorized account.
- Verify PostgreSQL tables and audit records.
- Test deployment with persistent private file storage and HTTPS.
- Add each new error and its correction below.
