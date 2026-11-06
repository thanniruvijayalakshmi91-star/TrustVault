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


## 2026-11-06 — Audit trail protection
- AI-assisted task: review whether audit rows could be edited or deleted after creation and whether denied requests were recorded.
- Initial output introduced a PostgreSQL trigger function with incorrect dollar-quote delimiters; that would fail when the database initializes.
- Correction: changed the function body delimiter to PostgreSQL's named dollar-quote form, added an append-only trigger, and recorded unauthenticated, non-admin, and denied document actions.
- Limitation caught: a database superuser can still change the schema or bypass ordinary application protections; this is not external WORM storage.
- Commits: [audit request logging](https://github.com/thanniruvijayalakshmi91-star/TrustVault/commit/ab9744d4f65e4f35e37f5190e53ac4b934823132), [audit trigger correction](https://github.com/thanniruvijayalakshmi91-star/TrustVault/commit/dbe4a17d1bf5804fbceacf3034d4297182a75763).

## 2026-11-06 — Make edit permission perform a real edit
- AI-assisted task: compare the read/edit sharing labels with the actual actions available to a shared user.
- The existing UI labelled a user as an editor but only exposed download; the permission did not provide an edit operation.
- Correction: added a replacement-file endpoint with server-side edit authorization and a matching UI for users with edit access.
- Verification still needed: test replacement with owner, editor, read-only user, and unrelated user accounts against a live database.
- Commits: [server-side edit endpoint](https://github.com/thanniruvijayalakshmi91-star/TrustVault/commit/557b717c8b6a4436a1db9b842526bb7328f91bc4), [editor UI](https://github.com/thanniruvijayalakshmi91-star/TrustVault/commit/8015590714c6dc89e370142e0bb6fc0eca6c6f52).

## 2026-11-06 — Add category and date search
- AI-assisted task: compare the document search implementation with the brief's search-by-name, owner, category, and date requirement.
- The previous search supported only filename and owner, so category/date filtering was missing.
- Correction: added a category column with a safe migration, category input, and date-range filters in the API and browser.
- Verification still needed: run the database migration and test empty, single-date, and date-range filters with real documents.
- Commits: [category/date API search](https://github.com/thanniruvijayalakshmi91-star/TrustVault/commit/8b933b0566d553c0531e5db7c9c9810089b504f7), [filter controls](https://github.com/thanniruvijayalakshmi91-star/TrustVault/commit/5e67ebe66d87d17b8a524aa82086f23bec3fa039).

## 2026-11-06 — Add focused permission tests
- AI-assisted task: create small tests for the document authorization policy.
- The tests cover the pure permission rules, but they do not call Express routes or a real database; they cannot prove end-to-end isolation.
- Correction: kept the tests narrowly scoped and documented the need for multi-account API tests rather than claiming full security coverage.
- Commits: [permission policy](https://github.com/thanniruvijayalakshmi91-star/TrustVault/commit/163e5e84c9867b812fea7de21e8f1d33fd6e0c6e), [unit tests](https://github.com/thanniruvijayalakshmi91-star/TrustVault/commit/d001dabeb746e1a9b2c2463fc6a26e6fe91b76e9).
