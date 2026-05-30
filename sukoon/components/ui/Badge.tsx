import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge = ({ label, color = '#2D8B6F', icon, style }: BadgeProps) => {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  iconContainer: {
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  }
});
