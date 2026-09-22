import * as SecureStore from 'expo-secure-store';
import { CareRecipientCondition } from './api';

const CAREGIVER_PROFILE_KEY = 'caregiver_profile';
const ORIENTATION_SEEN_KEY = 'orientation_seen';
const THANK_YOU_BACKGROUND_AT_KEY = 'thank_you_background_at';
const LAST_JOURNAL_SUBMISSION_AT_KEY = 'last_journal_submission_at';
const INACTIVITY_NOTIFICATION_ID_KEY = 'inactivity_notification_id';

export interface CaregiverProfile {
  caregiverId: string;
  caregiverFirstName: string;
  recipientName: string;
  recipientCondition: CareRecipientCondition;
  completedEntryCount: number;
  targetEntryCount: number;
}

export async function saveCaregiverProfile(profile: CaregiverProfile) {
  await SecureStore.setItemAsync(CAREGIVER_PROFILE_KEY, JSON.stringify(profile));
}

// A client-side-only unique-enough id — used for checkInId, which the app
// generates itself (unlike caregiverId, which the backend assigns).
export function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getCaregiverProfile(): Promise<CaregiverProfile | null> {
  const raw = await SecureStore.getItemAsync(CAREGIVER_PROFILE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CaregiverProfile;
  } catch (error) {
    console.error('Failed to parse stored caregiver profile:', error);
    return null;
  }
}

export async function getCaregiverId(): Promise<string | null> {
  const profile = await getCaregiverProfile();
  return profile?.caregiverId ?? null;
}

// In-memory only (not SecureStore) — resets to false every time the app
// process restarts, so sign-in is required on every launch. Temporary,
// for testing — swap for a persisted check once this isn't wanted anymore.
let signedInThisSession = false;

export function markSignedInThisSession() {
  signedInThisSession = true;
}

export function isSignedInThisSession(): boolean {
  return signedInThisSession;
}

export async function clearCaregiverProfile() {
  await SecureStore.deleteItemAsync(CAREGIVER_PROFILE_KEY);
}

export async function hasSeenOrientation(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ORIENTATION_SEEN_KEY)) === 'true';
}

export async function markOrientationSeen() {
  await SecureStore.setItemAsync(ORIENTATION_SEEN_KEY, 'true');
}

// completedEntryCount is authoritative from the backend (incremented
// atomically in create_checkin.py) — this just mirrors that value locally.
export async function setCompletedEntryCount(count: number) {
  const profile = await getCaregiverProfile();

  if (!profile) {
    return;
  }

  await saveCaregiverProfile({ ...profile, completedEntryCount: count });
}

export async function clearAllCaregiverData() {
  await clearCaregiverProfile();
  await SecureStore.deleteItemAsync(ORIENTATION_SEEN_KEY);
  await clearThankYouTimeoutState();
  await clearJournalReminderState();
}

export async function setLastJournalSubmissionAt(timestamp: number) {
  await SecureStore.setItemAsync(LAST_JOURNAL_SUBMISSION_AT_KEY, String(timestamp));
}

export async function getLastJournalSubmissionAt(): Promise<number | null> {
  const rawTimestamp = await SecureStore.getItemAsync(LAST_JOURNAL_SUBMISSION_AT_KEY);

  if (!rawTimestamp) {
    return null;
  }

  const timestamp = Number(rawTimestamp);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export async function setInactivityNotificationId(notificationId: string | null) {
  if (!notificationId) {
    await SecureStore.deleteItemAsync(INACTIVITY_NOTIFICATION_ID_KEY);
    return;
  }

  await SecureStore.setItemAsync(INACTIVITY_NOTIFICATION_ID_KEY, notificationId);
}

export async function getInactivityNotificationId(): Promise<string | null> {
  return await SecureStore.getItemAsync(INACTIVITY_NOTIFICATION_ID_KEY);
}

export async function clearJournalReminderState() {
  await SecureStore.deleteItemAsync(LAST_JOURNAL_SUBMISSION_AT_KEY);
  await SecureStore.deleteItemAsync(INACTIVITY_NOTIFICATION_ID_KEY);
}

export async function setThankYouBackgroundTimestamp(timestamp: number | null) {
  if (timestamp === null) {
    await SecureStore.deleteItemAsync(THANK_YOU_BACKGROUND_AT_KEY);
    return;
  }

  await SecureStore.setItemAsync(THANK_YOU_BACKGROUND_AT_KEY, String(timestamp));
}

export async function hasThankYouTimedOut(timeoutMs: number): Promise<boolean> {
  const rawTimestamp = await SecureStore.getItemAsync(THANK_YOU_BACKGROUND_AT_KEY);

  if (!rawTimestamp) {
    return false;
  }

  const backgroundAt = Number(rawTimestamp);
  if (Number.isNaN(backgroundAt)) {
    return false;
  }

  return Date.now() - backgroundAt >= timeoutMs;
}

export async function clearThankYouTimeoutState() {
  await SecureStore.deleteItemAsync(THANK_YOU_BACKGROUND_AT_KEY);
}
