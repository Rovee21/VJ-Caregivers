// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated';

// import { useColorScheme } from '@/hooks/use-color-scheme';

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

// export default function RootLayout() {
//   const colorScheme = useColorScheme();

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
//       </Stack>
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }

import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { cancelInactivityReminder, initializeNotifications } from '../services/notifications';
import { isEnrolled } from '../services/storage';

export default function RootLayout() {
  useEffect(() => {
    initializeNotifications();

    async function syncNotificationState() {
      const enrolled = await isEnrolled();

      if (!enrolled) {
        await cancelInactivityReminder();
      }
    }

    syncNotificationState();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // No header bars
        gestureEnabled: false, // Disable swipe back
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="enroll" 
        options={{
          gestureEnabled: false, // Can't swipe back
        }}
      />
      <Stack.Screen 
        name="recording"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="survey"
        options={{
          gestureEnabled: false, // Must complete survey
        }}
      />
      <Stack.Screen 
        name="history" 
        options={{
          gestureEnabled: true, // Allow swiping back from history
        }}
      />
    </Stack>
  );
}
