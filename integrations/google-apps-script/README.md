# VaiCar — Google Sheets / Apps Script driver adapter

## Scope
This integration is intended for the driver workflow only. Passenger registration/login, rides, dispatch, payments, and the Android app remain out of scope.

## Status
Planning scaffold only. It is not deployed or connected to the live API. Do not send real registrations or production data to it.

## Proposed architecture
- The existing server API acts as a server-to-server proxy to Apps Script; browser code must never receive an integration secret.
- Google Sheets stores driver profile and approval metadata.
- A private Google Drive folder stores driver documents. Store file IDs, not public sharing URLs.
- Authentication and session issuance must be designed and tested before login is moved. Never store plain-text passwords in Sheets.
- Existing passenger endpoints and data remain unchanged.

## Required Google resources
1. Dedicated test spreadsheet, shared only with authorized operators.
2. Dedicated private Drive folder for driver documents; do not enable public link access.
3. Apps Script Web App project with server-side configuration for spreadsheet ID, Drive folder ID, and a long random integration secret.
4. Existing API service environment variables for the Apps Script URL and the same integration secret. Do not use frontend VITE variables for secrets.

## Before any live connection
- Use a separate test spreadsheet and synthetic data.
- Validate CPF, date of birth, phone, vehicle, document metadata, consent, and duplicate checks server-side.
- Add rate limits, audit logs, and strict authorization for administrative approval/rejection.
- Test driver registration, login/session renewal, profile retrieval, document upload/download permissions, and approval status.
- Confirm the Apps Script deployment URL and spreadsheet/folder IDs before configuring the API.
- Do not migrate existing accounts until a separate migration plan is approved.

## Important limitation
Apps Script Web Apps have platform-specific redirect and CORS behavior. Keep calls server-to-server through the existing API rather than calling Apps Script directly from the browser. This file documents the intended boundary; it does not itself connect or migrate data.
