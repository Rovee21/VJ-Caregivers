import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { initializeNotifications } from '../services/notifications';

export default function RootLayout() {
  useEffect(() => {
    initializeNotifications();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="intake" />
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
