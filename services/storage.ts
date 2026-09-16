import * as SecureStore from 'expo-secure-store';
import { CareRecipientCondition } from './api';

const CAREGIVER_PROFILE_KEY = 'caregiver_profile';
const ORIENTATION_SEEN_KEY = 'orientation_seen';
const THANK_YOU_BACKGROUND_AT_KEY = 'thank_you_background_at';

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

// Persisted — true once intake has ever been completed on this device, so
// sign-in only happens once, not on every launch.
export async function isSignedIn(): Promise<boolean> {
  return (await getCaregiverId()) !== null;
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
