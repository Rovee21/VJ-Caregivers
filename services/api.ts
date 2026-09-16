const PLACEHOLDER_API_BASE_URL = 'https://TODO-caregivers-backend.example.com/api';

// Backend URL comes from .env (EXPO_PUBLIC_ vars are inlined by Expo at
// build time) so it's a one-line config change, not a code change, and
// stays out of version-controlled app.json. See .env.example.
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!configuredApiBaseUrl) {
  console.warn(
    'EXPO_PUBLIC_API_BASE_URL is not set — copy .env.example to .env and fill in your deployed API values.'
  );
}

export const API_BASE_URL = configuredApiBaseUrl || PLACEHOLDER_API_BASE_URL;

// Shared-secret gate on the API Gateway (blocks casual/public access) — not
// a substitute for real per-user auth. See backend/README.md.
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  };
}

export type CareRecipientCondition = 'dementia' | 'cancer';

export interface CaregiverProfileData {
  caregiverId: string;
  caregiverFirstName: string;
  recipientName: string;
  recipientCondition: CareRecipientCondition;
  completedEntryCount: number;
  targetEntryCount: number;
}

export interface CaregiverIntakeInput {
  caregiverFirstName: string;
  recipientName: string;
  recipientCondition: CareRecipientCondition;
}

export async function createCaregiverProfile(
  input: CaregiverIntakeInput
): Promise<CaregiverProfileData> {
  const response = await fetch(`${API_BASE_URL}/caregivers`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Could not create your profile');
  }

  return result;
}

export interface VoiceClip {
  uri: string;
  durationSeconds: number;
}

interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
}

async function requestUploadUrl(
  caregiverId: string,
  checkInId: string,
  recordingType: 'self' | 'recipient'
): Promise<UploadUrlResponse> {
  const response = await fetch(`${API_BASE_URL}/checkins/upload-url`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ caregiverId, checkInId, recordingType }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Could not prepare recording upload');
  }

  return result;
}

async function uploadClipToS3(clip: VoiceClip, uploadUrl: string): Promise<void> {
  const fileResponse = await fetch(clip.uri);
  const audioBlob = await fileResponse.blob();

  // No Content-Type header here on purpose: React Native's fetch overrides
  // an explicitly-set Content-Type on a Blob body with the Blob's own
  // internal type, and the presigned URL isn't signed to require one (see
  // get_upload_url.py) — so there's nothing correct to set it to anyway.
  // Presigned URLs are also self-authorizing via their signature — don't add
  // the x-api-key header, it isn't part of what was signed.
  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: audioBlob,
  });

  if (!putResponse.ok) {
    const responseBody = await putResponse.text().catch(() => '');
    console.error('S3 upload failed:', putResponse.status, putResponse.statusText, responseBody);
    throw new Error(
      `Recording upload failed (${putResponse.status} ${putResponse.statusText}): ${responseBody.slice(0, 300)}`
    );
  }
}

// One journal entry, submitted as a single call instead of the old app's
// separate "upload recording" + "save survey" round trip. Each recording is
// uploaded directly to S3 via a presigned URL (keeps large audio payloads
// off API Gateway/Lambda) before the check-in record itself is created.
export interface CheckInSubmission {
  caregiverId: string;
  checkInId: string;
  selfRecording: VoiceClip;
  emotions: string[];
  stressLevel: number;
  symptoms: string[];
  symptomsSkipped: boolean;
  recipientRecording?: VoiceClip;
}

export interface CheckInSubmissionResult {
  completedEntryCount: number;
}

export async function submitCheckIn(data: CheckInSubmission): Promise<CheckInSubmissionResult> {
  const selfUpload = await requestUploadUrl(data.caregiverId, data.checkInId, 'self');
  await uploadClipToS3(data.selfRecording, selfUpload.uploadUrl);

  let recipientUpload: UploadUrlResponse | undefined;
  if (data.recipientRecording) {
    recipientUpload = await requestUploadUrl(data.caregiverId, data.checkInId, 'recipient');
    await uploadClipToS3(data.recipientRecording, recipientUpload.uploadUrl);
  }

  const response = await fetch(`${API_BASE_URL}/checkins`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      caregiverId: data.caregiverId,
      checkInId: data.checkInId,
      emotions: data.emotions,
      stressLevel: data.stressLevel,
      symptoms: data.symptoms,
      symptomsSkipped: data.symptomsSkipped,
      selfRecordingKey: selfUpload.s3Key,
      selfRecordingDurationSeconds: data.selfRecording.durationSeconds,
      ...(recipientUpload
        ? {
            recipientRecordingKey: recipientUpload.s3Key,
            recipientRecordingDurationSeconds: data.recipientRecording!.durationSeconds,
          }
        : {}),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Could not save your check-in');
  }

  return result;
}

export interface CheckInHistoryEntry {
  id: string;
  submittedAt: string;
  emotions: string[];
  stressLevel: number;
}

export async function getCheckInHistory(caregiverId: string): Promise<CheckInHistoryEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/caregivers/${caregiverId}/checkins`, {
      headers: apiHeaders(),
    });

    if (!response.ok) {
      console.error('Failed to fetch check-in history:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch check-in history:', error);
    return [];
  }
}
