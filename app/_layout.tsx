import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { cancelInactivityReminder, initializeNotifications } from '../services/notifications';

export default function RootLayout() {
  useEffect(() => {
    initializeNotifications();
    // Every fresh launch starts signed out (see isSignedInThisSession in
    // services/storage.ts), so there's never a stale reminder to cancel here.
    cancelInactivityReminder();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="signin" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="orientation" />
      <Stack.Screen name="index" />
      <Stack.Screen name="checkin" />
      <Stack.Screen
        name="history"
        options={{
          gestureEnabled: true, // Allow swiping back from history
        }}
      />
    </Stack>
  );
}
