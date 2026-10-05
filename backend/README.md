# Voice Journal Caregivers — backend

Serverless AWS backend: API Gateway (REST, with an API key) → Lambda (Python) → DynamoDB + S3.

Full step-by-step AWS console setup guide (BAA, IAM, DynamoDB, S3, Lambda, API Gateway, and wiring the app to it) is published separately — ask for the link if you don't have it.

## Data model

**DynamoDB table `VoiceJournalCaregivers-Caregivers`** (partition key `caregiverId`)
- `caregiverFirstName`, `recipientName`, `recipientCondition` (`dementia` | `cancer`)
- `completedEntryCount`, `targetEntryCount`, `createdAt`, `lastSubmittedAt`

**DynamoDB table `VoiceJournalCaregivers-CheckIns`** (partition key `caregiverId`, sort key `submittedAt`)
- `checkInId`, `emotions` (list), `stressLevel`, `symptoms` (list), `symptomsSkipped`
- `selfRecordingKey`, `selfRecordingDurationSeconds`
- `recipientRecordingKey`, `recipientRecordingDurationSeconds` (optional)

**S3 bucket** — audio files at `caregivers/{caregiverId}/{checkInId}/{self|recipient}.mp4` (AAC audio in an MP4 container — the same encoding either way, just labeled `.mp4` for recognizability)

## Endpoints (`lambdas/`)

- `POST /caregivers` (`create_caregiver.py`) — creates a caregiver/recipient record, returns `caregiverId`
- `POST /checkins/upload-url` (`get_upload_url.py`) — returns a presigned S3 PUT URL for one recording
- `POST /checkins` (`create_checkin.py`) — records a check-in after both recordings are uploaded; atomically increments `completedEntryCount`
- `GET /caregivers/{caregiverId}/checkins` (`get_checkin_history.py`) — history list for the calendar view
- `GET /admin/progress` (`get_admin_progress.py`) — progress-only list across all caregivers (entry count, last active), behind a separate Cognito login, not the API key. Powers `admin-portal/index.html`.

Each Lambda is a single self-contained file (only depends on `boto3`, which ships with the Lambda Python runtime) so it can be pasted directly into the Lambda console's inline code editor. `get_admin_progress.py` runs under its own `vjc-admin-lambda-role` (read-only `dynamodb:Scan` on Caregivers only) — separate from the other four, which share `vjc-lambda-execution-role` and need write access.

## Admin progress portal (`admin-portal/`)

A static page (`index.html`), hosted on S3 + CloudFront, logged into via AWS Cognito — for a collaborator who needs to see study progress (entry counts, last-active dates) without app access or AWS console access. Deliberately shows progress only, not emotions/stress/symptoms/recordings. See the setup guide's "Admin progress portal" phase for deployment steps; before uploading, fill in the three placeholders in the `<script>` tag (`COGNITO_DOMAIN`, `CLIENT_ID`, `API_URL`).

## Data export (`scripts/`)

`export_data.py` — run locally (not part of the deployed backend) to pull everything into a spreadsheet plus a folder of recordings. See the script's own docstring for usage. Needs broader read credentials (`dynamodb:Scan` + `s3:GetObject`) than either Lambda role above has — run it with your own AWS user via `aws configure`, not a role from this backend.

## Known limitation — no per-user auth yet

The app's own endpoints (everything except `/admin/progress`) are gated by a shared API key (blocks casual/public access) but otherwise trust whatever `caregiverId` the client sends — there's no verification that a request actually comes from that caregiver. Add real per-caregiver authentication (e.g. AWS Cognito) before onboarding real study participants; this is fine for internal testing with fake data only. (This is separate from the admin portal's Cognito login above, which is real per-user auth, just for the one collaborator role.)
