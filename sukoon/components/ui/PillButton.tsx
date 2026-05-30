import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

interface PillButtonProps {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'onboarding';
}

export const PillButton = ({ label, emoji, selected = false, onPress, style, variant = 'default' }: PillButtonProps) => {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getStyle = () => {
    if (variant === 'onboarding') {
      return {
        pill: {
          borderColor: 'white',
          backgroundColor: selected ? 'white' : 'transparent',
        },
        text: {
          color: selected ? colors.primary : 'white',
        }
      };
    }
    return {
      pill: {
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : 'transparent',
      },
      text: {
        color: selected ? colors.background : colors.textPrimary,
      }
    };
  };

  const vStyle = getStyle();

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.pill, vStyle.pill, style]}
    >
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.label, vStyle.text]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
