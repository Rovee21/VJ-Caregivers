# Voice Journal Caregivers — backend

Serverless AWS backend: API Gateway (REST, with an API key) → Lambda (Python) → DynamoDB + S3.

Full step-by-step AWS console setup guide (BAA, IAM, DynamoDB, S3, Lambda, API Gateway, and wiring the app to it) is published separately — ask for the link if you don't have it.

## Data model

**DynamoDB table `VoiceJournalCaregivers-Caregivers`** (partition key `caregiverId`)
- `caregiverFirstName`, `recipientName`, `recipientCondition` (`dementia` | `cancer`)
- `completedEntryCount`, `targetEntryCount`, `createdAt`

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

Each Lambda is a single self-contained file (only depends on `boto3`, which ships with the Lambda Python runtime) so it can be pasted directly into the Lambda console's inline code editor.

## Known limitation — no per-user auth yet

Requests are gated by a shared API key (blocks casual/public access) but the API otherwise trusts whatever `caregiverId` the client sends — there's no verification that a request actually comes from that caregiver. Add real authentication (e.g. AWS Cognito) before onboarding real study participants; this is fine for internal testing with fake data only.
