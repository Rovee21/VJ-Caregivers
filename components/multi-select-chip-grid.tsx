import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Palette } from '@/constants/palette';

export interface ChipItem {
  key: string;
  label: string;
  emoji?: string;
}

interface MultiSelectChipGridProps {
  items: ChipItem[];
  selected: string[];
  onToggle: (key: string) => void;
  // 'grid': fixed 2-column tiles (emotions). 'wrap': auto-width pills that
  // flow left-to-right and wrap (symptom checklists).
  layout?: 'grid' | 'wrap';
  lastItemFullWidth?: boolean;
}

export function MultiSelectChipGrid({
  items,
  selected,
  onToggle,
  layout = 'grid',
  lastItemFullWidth,
}: MultiSelectChipGridProps) {
  return (
    <View style={[styles.container, layout === 'wrap' && styles.containerWrap]}>
      {items.map((item, index) => {
        const isSelected = selected.includes(item.key);
        const isLast = index === items.length - 1;

        return (
          <TouchableOpacity
            key={item.key}
            style={[
              layout === 'grid' ? styles.tile : styles.pill,
              layout === 'grid' && lastItemFullWidth && isLast && styles.tileFullWidth,
              isSelected && styles.selected,
            ]}
            onPress={() => onToggle(item.key)}
            activeOpacity={0.8}
          >
            {item.emoji ? (
              <Text style={layout === 'wrap' ? styles.emojiInline : styles.emoji}>
                {item.emoji}
              </Text>
            ) : null}
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  containerWrap: {
    justifyContent: 'flex-start',
  },
  tile: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: Palette.chipBorder,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: Palette.cardBackground,
  },
  tileFullWidth: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Palette.chipBorder,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginRight: 8,
    backgroundColor: Palette.cardBackground,
  },
  selected: {
    borderColor: Palette.chipSelectedBorder,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  emojiInline: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  labelSelected: {
    color: Palette.chipSelectedBorder,
    fontWeight: '700',
  },
});
