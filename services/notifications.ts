import * as Notifications from 'expo-notifications';
import {
  clearJournalReminderState,
  getInactivityNotificationId,
  setInactivityNotificationId,
  setLastJournalSubmissionAt,
} from './storage';

export const INACTIVITY_REMINDER_MS = 72 * 60 * 60 * 1000;


const REMINDER_TITLE = 'Voice Journal Caregivers Reminder';
const REMINDER_BODY = "It's time for today's caregiver check-in.";

export function initializeNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestReminderPermissions(): Promise<boolean> {
  const existingPermissions = await Notifications.getPermissionsAsync();

  if (existingPermissions.granted || existingPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return requestedPermissions.granted || requestedPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function cancelInactivityReminder() {
  const notificationId = await getInactivityNotificationId();

  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  await clearJournalReminderState();
}

export async function scheduleInactivityReminder(fromTimestamp: number = Date.now()) {
  await cancelInactivityReminder();
  await setLastJournalSubmissionAt(fromTimestamp);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.floor(INACTIVITY_REMINDER_MS / 1000),
      repeats: false,
    },
  });

  await setInactivityNotificationId(notificationId);
  return notificationId;
}

export async function refreshInactivityReminderAfterSubmission() {
  const hasPermission = await requestReminderPermissions();
  const submissionAt = Date.now();

  if (!hasPermission) {
    await cancelInactivityReminder();
    await setLastJournalSubmissionAt(submissionAt);
    return { scheduled: false, permissionGranted: false };
  }

  const notificationId = await scheduleInactivityReminder(submissionAt);
  return { scheduled: true, permissionGranted: true, notificationId };
}
