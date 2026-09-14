import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '@/constants/palette';

interface ScreenHeaderProps {
  // Omit for screens like the final "done" step, which show only rightText.
  label?: string;
  rightText: string;
}

export function ScreenHeader({ label, rightText }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      {label ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : (
        <View />
      )}
      <Text style={styles.rightText}>{rightText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: Palette.badgeBackground,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: Palette.badgeText,
    fontWeight: '700',
    fontSize: 14,
  },
  rightText: {
    color: Palette.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
