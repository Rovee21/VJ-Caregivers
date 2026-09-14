import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Palette } from '@/constants/palette';

interface ScreenCardProps {
  children: React.ReactNode;
  // Content rendered below the main content, outside the scroll area — e.g.
  // the sign-in screen's "Trouble signing in?" footnote.
  belowCard?: React.ReactNode;
}

// Shared full-bleed screen shape used by every screen in the study flow, so
// spacing/background stay consistent without repeating it per screen.
export function ScreenCard({ children, belowCard }: ScreenCardProps) {
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      {belowCard}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Palette.cardBackground,
    paddingTop: 56,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
