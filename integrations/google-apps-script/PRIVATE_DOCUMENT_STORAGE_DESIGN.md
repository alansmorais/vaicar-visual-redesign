# VaiCar private document storage — implementation contract

## Status and safety boundary

Design specification only. No upload/download action is enabled in `Code.gs`, no API route calls this flow, and the Apps Script feature flag must remain disabled. This document does not authorize deployment or production changes.

Google Drive is the private binary store; Google Sheets stores only metadata and Drive file IDs. Do not store document bytes, base64 payloads, public links, or secrets in Sheets.

## Allowed document types

The future API must accept only an explicit enum, not a caller-supplied Drive folder or path:

- `driver_cnh`
- `driver_crlv`
- `driver_proof_of_address`
- `driver_criminal_record`
- `passenger_identity_document`
- `passenger_criminal_record` (only where legally required and explicitly consented)

The business/legal need for each document type must be confirmed before enabling it. Public profile photos are not part of this private-document endpoint.

## Required API boundary

1. Require a valid authenticated API session on every upload/download request.
2. Derive the owner UID from verified server-side identity; never trust a UID supplied by the browser.
3. Permit a user to upload/read only their own documents. Admin access must use a separately verified admin role and be audited.
4. Validate file size (maximum 10 MiB), allowlisted MIME, extension, and file signature server-side. Reject HTML, SVG, executables, archives, and MIME/signature mismatches.
5. Generate the Drive filename and folder placement on the server. Never accept arbitrary paths, folder IDs, or filenames from the client.
6. Keep the integration secret only in API environment configuration and Apps Script Script Properties. Never put it in Sheets, source code, logs, frontend variables, or responses.
7. Send requests only server-to-server. The browser must never call Apps Script directly.
8. The Apps Script endpoint must reject unknown actions and malformed/oversized requests before touching Drive or Sheets.

## Proposed request contract

### Upload

The API first authenticates the user and validates the file. It then sends a server-to-server request with:

- `action: "document.upload"`
- verified `ownerUid`
- allowlisted `documentType`
- base64 `fileData`
- validated `mimeType`
- random `idempotencyKey`
- integration secret in the authenticated server-to-server envelope

Apps Script must validate the action, UID/document-type syntax, payload size, MIME and signature again. It reads `DRIVE_FOLDER_ID` from trusted Config, creates a file with a generated non-identifying name, and explicitly ensures the file and folder are not shared publicly. It returns only the Drive file ID and minimal metadata to the API. The API stores that file ID in the owner's profile record. Do not return a Drive URL to the client.

### Download

The API authenticates and authorizes the requester before asking Apps Script for a file. The server supplies the verified owner UID and stored file ID. Apps Script must confirm the file is within the configured private folder and that its ownership metadata matches the requested owner. It returns bytes to the API server only; the API streams them with a validated content type and `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-store`. Never expose Drive URLs or allow arbitrary file IDs from clients.

## Required controls before enabling

- **Ownership binding:** metadata must bind Drive file ID to owner UID and document type.
- **Idempotency:** repeated requests with the same key and same content return the same result; key reuse with different content is rejected.
- **Audit:** append actor, owner UID, action, timestamp, result, document type and request ID to AuditLog. Never log base64, secrets, document contents, or public URLs.
- **Concurrency:** protect duplicate/idempotency checks and audit writes with Apps Script LockService.
- **Deletion/replacement:** replacement must not orphan old files; define retention and deletion behavior before implementation.
- **Rate limits:** apply API-side rate limits to uploads and downloads.
- **Admin access:** admin authorization must be enforced by the API, not inferred from a caller-provided role.
- **Testing:** test unauthorized access, cross-user file-ID substitution, invalid signatures, oversized payloads, unknown action, missing folder config, duplicate/idempotency conflicts, private sharing permissions, and no public URL leakage.
- **Deployment:** test only with synthetic data in a dedicated test spreadsheet and Drive folder. Keep `VAICAR_DRIVER_SHEETS_ENABLED` disabled until API + Apps Script integration tests pass.

## Open implementation gate

Do not enable this flow until the API route, Apps Script action, ownership metadata, idempotency, audit, and end-to-end tests are implemented and reviewed together. No production deployment or data migration is part of this phase.
