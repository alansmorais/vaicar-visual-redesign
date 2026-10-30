# VaiCar Apps Script test deployment checklist

This checklist is for the isolated TEST project only. It does not authorize production changes.

## Scope boundary
Apps Script/Sheets may store passenger and driver registration/profile records only. It must not receive rides, deliveries, dispatch requests, GPS updates, online/offline events, pricing, or payment events.

## Before deployment
- [ ] Confirm this is the dedicated test spreadsheet and no real registrations are present.
- [ ] Confirm tabs exist: Passengers, Drivers, Config, AuditLog.
- [ ] Confirm Config has ENVIRONMENT=TEST, DRIVE_FOLDER_ID populated, and INTEGRATION_STATUS=NOT_CONNECTED.
- [ ] Confirm the driver documents folder is private and not shared by public link.
- [ ] Review the current Code.gs from branch redesign/preview; do not paste secrets into GitHub or the spreadsheet.
- [ ] In Apps Script Project Settings > Script properties, set VAICAR_SHARED_SECRET to a long random value. Keep it private.
- [ ] Deploy a new TEST Web App version only after review. The current endpoint supports only authenticated driver.health and rejects all write actions.
- [ ] Review `PRIVATE_DOCUMENT_STORAGE_DESIGN.md` before implementing any private document actions.
- [ ] Keep API feature flag VAICAR_DRIVER_SHEETS_ENABLED disabled. Do not add Apps Script variables to frontend/VITE settings.

## Expected health response
A server-to-server POST body containing the configured sharedSecret and action=driver.health should return:
`{ "success": true, "service": "vaicar-registration-adapter", "status": "ready" }`

Requests without the correct secret should return success=false. Any action other than driver.health should return success=false and must not write to Sheets or Drive.

## Not implemented yet
- Passenger registration writes.
- Driver registration writes.
- Identity-token verification and account ownership checks at the API boundary.
- Private document upload/download handling (design contract documented, implementation and end-to-end tests pending).
- Duplicate checks, idempotency, and full audit logging for registration operations.
- Admin authorization for approval/rejection.
- Integration tests against a deployed TEST Web App.

Do not enable live registration until the above are implemented and verified. Never store passwords, session tokens, or public document links in Sheets.
