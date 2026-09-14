import Constants from 'expo-constants';

const PLACEHOLDER_API_BASE_URL = 'https://TODO-caregivers-backend.example.com/api';

// Backend URL comes from app.json's extra.apiBaseUrl so it's a one-line config
// change once the caregivers backend exists, instead of a code change.
const configuredApiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;

if (!configuredApiBaseUrl || configuredApiBaseUrl === PLACEHOLDER_API_BASE_URL) {
  console.warn(
    'API_BASE_URL is still the placeholder value — set extra.apiBaseUrl in app.json to the real backend once it exists.'
  );
}

export const API_BASE_URL = configuredApiBaseUrl || PLACEHOLDER_API_BASE_URL;

export type CareRecipientCondition = 'dementia' | 'cancer';

export interface SignInCodeResponse {
  caregiverId: string;
  caregiverFirstName: string;
  recipientName: string;
  recipientCondition: CareRecipientCondition;
  completedEntryCount: number;
  targetEntryCount: number;
}

// TODO(backend): replace with a real endpoint once the caregivers backend
// exists. For now this returns a mock response so the sign-in -> welcome ->
// orientation -> check-in flow is click-through-able during development.
export async function redeemSignInCode(code: string): Promise<SignInCodeResponse> {
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    throw new Error('Please enter your Voice Journal code');
  }

  console.warn('redeemSignInCode is using a mock response — no backend is wired up yet.');

  return {
    caregiverId: `mock-${trimmedCode.toLowerCase()}`,
    caregiverFirstName: 'Mary',
    recipientName: 'John',
    recipientCondition: 'dementia',
    completedEntryCount: 6,
    targetEntryCount: 12,
  };
}

export interface VoiceClip {
  uri: string;
  durationSeconds: number;
}

// One journal entry, submitted as a single call instead of the old app's
// separate "upload recording" + "save survey" round trip — there's no
// intermediate recording ID to thread between screens this way.
export interface CheckInSubmission {
  caregiverId: string;
  selfRecording: VoiceClip;
  emotions: string[];
  stressLevel: number;
  symptoms: string[];
  symptomsSkipped: boolean;
  recipientRecording?: VoiceClip;
}

// TODO(backend): the caregivers study needs its own new backend — this app
// currently has no real one to call. This mock lets sign-in through
// submission work end-to-end during development; swap the body for a real
// `fetch(`${API_BASE_URL}/checkins`, ...)` once that backend exists.
export async function submitCheckIn(data: CheckInSubmission): Promise<void> {
  console.warn('submitCheckIn is using a mock response — no backend is wired up yet.', data);
}

export interface CheckInHistoryEntry {
  id: string;
  submittedAt: string;
  emotions: string[];
  stressLevel: number;
}

// TODO(backend): replace with a real fetch once the caregivers backend
// exists. Returns an empty list for now so the history screen renders its
// empty state instead of erroring against a placeholder URL.
export async function getCheckInHistory(caregiverId: string): Promise<CheckInHistoryEntry[]> {
  console.warn('getCheckInHistory is using a mock response — no backend is wired up yet.', caregiverId);
  return [];
}
