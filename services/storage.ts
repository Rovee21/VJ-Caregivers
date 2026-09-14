import * as SecureStore from 'expo-secure-store';

const PARTICIPANT_ID_KEY = 'participant_id';
const PARTICIPANT_FIRST_NAME_KEY = 'participant_first_name';
const THANK_YOU_BACKGROUND_AT_KEY = 'thank_you_background_at';
const LAST_JOURNAL_SUBMISSION_AT_KEY = 'last_journal_submission_at';
const INACTIVITY_NOTIFICATION_ID_KEY = 'inactivity_notification_id';

export async function saveParticipantData(id: string, firstName: string) {
  await SecureStore.setItemAsync(PARTICIPANT_ID_KEY, id);
  await SecureStore.setItemAsync(PARTICIPANT_FIRST_NAME_KEY, firstName);
}

export async function getParticipantId(): Promise<string | null> {
  return await SecureStore.getItemAsync(PARTICIPANT_ID_KEY);
}

export async function getParticipantFirstName(): Promise<string | null> {
  return await SecureStore.getItemAsync(PARTICIPANT_FIRST_NAME_KEY);
}

// Keep for backward compatibility during transition
export async function getParticipantName(): Promise<string | null> {
  return await getParticipantFirstName();
}

export async function isEnrolled(): Promise<boolean> {
  const id = await getParticipantId();
  return id !== null;
}

export async function clearParticipantInfo() {
  await SecureStore.deleteItemAsync(PARTICIPANT_ID_KEY);
  await SecureStore.deleteItemAsync(PARTICIPANT_FIRST_NAME_KEY);
}

export async function clearAllParticipantData() {
  await clearParticipantInfo();
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
