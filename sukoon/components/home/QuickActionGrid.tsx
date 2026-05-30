import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';

const ACTIONS = [
  { id: 'focus', icon: 'timer-outline', labelKey: 'quick_focus', route: '/(tabs)/focus' },
  { id: 'breathe', icon: 'leaf-outline', labelKey: 'quick_breathe', route: '/(tabs)/breathe' },
  { id: 'meditate', icon: 'moon-outline', labelKey: 'quick_meditate', route: '/(tabs)/meditate' },
  { id: 'progress', icon: 'flower-outline', labelKey: 'quick_progress', route: '/(tabs)/garden' },
] as const;

export const QuickActionGrid = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => (
        <Card 
          key={action.id} 
          style={styles.card} 
          onPress={() => router.push(action.route)}
        >
          <Ionicons name={action.icon as any} size={28} color={colors.primary} style={styles.icon} />
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t(action.labelKey)}</Text>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  }
});
