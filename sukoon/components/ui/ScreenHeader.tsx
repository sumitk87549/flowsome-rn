import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  rightIcon?: React.ReactNode | keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export const ScreenHeader = ({ title, rightIcon, onRightPress }: ScreenHeaderProps) => {
  const { colors } = useTheme();

  const renderRight = () => {
    if (!rightIcon) return null;
    if (typeof rightIcon === 'string') {
      return (
        <Ionicons
          name={rightIcon as keyof typeof Ionicons.glyphMap}
          size={24}
          color={colors.textPrimary}
          onPress={onRightPress}
          style={styles.icon}
        />
      );
    }
    return (
      <TouchableOpacity onPress={onRightPress} style={styles.icon}>
        {rightIcon as React.ReactNode}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {renderRight()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  icon: {
    padding: 4,
  }
});
