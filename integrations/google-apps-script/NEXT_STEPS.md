# VaiCar registration migration — current setup and next steps

## Scope
Google Apps Script + Google Sheets are for passenger and driver registration/profile records only. Private driver documents belong in Google Drive. They must not receive or process rides, deliveries, GPS tracking, online-state lifecycle, payments, pricing, or dispatch.

## Current setup
The user reports that the spreadsheet tabs were created and the private driver documents folder was created. The Config sheet should remain:
- ENVIRONMENT = TEST
- DRIVE_FOLDER_ID = populated
- INTEGRATION_STATUS = NOT_CONNECTED

## Latest isolated code changes
- Added a Passengers sheet schema alongside Drivers, Config, and AuditLog.
- Updated the architecture README to explicitly include passenger and driver registration/profile records, while excluding rides and dispatch.
- Hardened the server-side request body so caller payload cannot override the selected action or shared secret.
- Added an authenticated Apps Script diagnostic endpoint that accepts only `driver.health`.
- All registration and profile actions remain disabled. No ride/delivery/GPS/online/payment actions are implemented here.
- Added `driver.health` to the server-side client action type. The client remains unused by routes and disabled by default.

## Next safe steps
1. Review the Apps Script code in this branch.
2. In Apps Script Project Settings, set a strong `VAICAR_SHARED_SECRET` as a Script Property. Do not put it in code, Sheets, frontend variables, or chat.
3. Only after review, manually copy the updated Code.gs into the dedicated test Apps Script project, save, and deploy a test Web App. Do not change production.
4. Configure the URL and matching secret only in a non-production server environment, then run a health-only test.
5. After health is verified, design and implement passenger/driver registration actions with server-side identity verification, duplicate checks, private file upload, audit logging, and admin authorization. Never store passwords, session tokens, or public document links in Sheets.

No live registrations are migrated or enabled. Do not deploy production or alter the Android APK/Kotlin/Gradle files.
