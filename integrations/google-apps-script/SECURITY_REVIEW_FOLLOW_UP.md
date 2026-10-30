# VaiCar security review — follow-up findings

## Scope and status

This is a review note for the open `security/registration-identity-guard` pull request. It records adjacent risks discovered during route review; it does not authorize production changes. No deployment or data migration has been performed.

## Confirmed follow-up risk: receipt endpoints are unauthenticated

File: `api/src/routes/receipts.ts`

Both `GET /api/v1/receipts/:id` and `GET /api/v1/receipts/:id/html` call `getReceipt()` without authentication or participant authorization. The JSON and HTML responses include passenger/driver names, vehicle plate, trip origin/destination, time, distance, and payment information.

### Safe remediation decision needed in implementation design

Do not simply add bearer-token authentication without checking existing receipt-sharing behavior. Before changing the endpoint, inspect how receipts are generated and linked in the client. Then choose one of these designs:

1. **Authenticated receipts:** require a valid token and verify the caller is the passenger, assigned driver, or authorized admin for the associated ride.
2. **Shareable receipt capability:** preserve link sharing using a cryptographically random, high-entropy, revocable token stored separately from the receipt ID, with expiry/rate limits and minimal data exposure.

A sequential or guessable receipt ID must not be treated as authorization. Add tests for unauthenticated access, unrelated passenger/driver access, admin access, expired/revoked share tokens (if used), and HTML escaping of all receipt values.

## Other follow-up checks

- Review every endpoint that returns profile data to ensure legacy sensitive document URL fields are redacted.
- Review public driver discovery data; confirm whether full vehicle plates are necessary to show before a ride is accepted.
- Existing legacy document URLs may remain in Firestore or external storage. Response redaction and rejecting new URL submissions do not delete or make previously shared files private.
- The private Google Drive document flow remains design-only. Do not enable Apps Script registration writes or `VAICAR_DRIVER_SHEETS_ENABLED`.
- Keep production deployment and data migration out of this PR until separately approved.

## Verified boundary

The current admin router uses `authenticate` and `requireAdmin`. Receipt endpoints are mounted directly under `/api/v1/receipts` and do not currently use authentication middleware.
