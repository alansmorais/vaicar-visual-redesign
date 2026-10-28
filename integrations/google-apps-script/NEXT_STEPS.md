# VaiCar driver migration — current setup and next steps

The user has manually run the Apps Script setup and reports:
- The spreadsheet tabs were added successfully.
- The private driver documents folder was created successfully.

Next manual verification:
1. In the spreadsheet tab Config, confirm ENVIRONMENT=TEST.
2. Confirm DRIVE_FOLDER_ID has a value.
3. Confirm INTEGRATION_STATUS=NOT_CONNECTED.
Do not share the folder publicly and do not paste document IDs or secrets into public chat or GitHub.

Next engineering step (not yet activated):
- Build a server-side Apps Script client in the existing API service.
- Keep Apps Script URL and shared secret in server-side environment variables only, never VITE/frontend variables.
- Keep passenger routes untouched.
- Implement driver registration/profile bridge behind a feature flag and test using a separate test spreadsheet and synthetic records.
- Complete authentication/session design and admin authorization before enabling writes or moving driver login.
- No production deploy and no data migration until explicitly approved.
