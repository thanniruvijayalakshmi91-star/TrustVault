# TrustVault threat model

Date reviewed: 2026-11-06

## Assets
- Private uploaded document contents and metadata.
- User credentials and authenticated sessions.
- Document sharing permissions.
- Audit records used to investigate access.

## Trust boundaries
- Browser to Express API.
- Express API to PostgreSQL.
- Express API to private file storage.
- Owner/admin actions versus read-only and edit-shared users.

## Threats and mitigations

| Threat | Mitigation in this project | Remaining risk |
|---|---|---|
| Guessing a document ID and downloading another user's file | Document queries are scoped to owner, admin, or an explicit share; authorization is performed server-side | Must be verified with live multi-account tests |
| Registering an account with an administrator email | Public registration always assigns the normal owner role; admin promotion is a trusted server-side command | Deployment environment access must be protected |
| Password guessing | Login rate limiting and bcrypt password hashing | No MFA or account lockout workflow |
| Session theft | HTTP-only, same-site cookies and production secure-cookie setting | HTTPS and secret rotation must be configured in deployment |
| Uploading a renamed executable | MIME allowlist plus basic file-signature checks and 10 MB limit | Not a malware scanner; complex formats need deeper inspection |
| Unauthorized sharing or revocation | Server-side owner/admin checks | Must be tested against direct API calls |
| Audit record alteration | Audit table should be append-only at the database layer | A database superuser can still alter schema or data; external/WORM log storage is not implemented |
| Lost uploaded files after redeploy | Files are stored outside the public directory | Persistent private storage must be configured by the deployment provider |

## Accepted limitations
- This version does not include malware scanning, MFA, external immutable log storage, or a full enterprise identity provider.
- A syntax test is not a substitute for end-to-end authorization tests against a running PostgreSQL instance.
- Do not claim production readiness until the manual security checklist and deployment checks have passed.
