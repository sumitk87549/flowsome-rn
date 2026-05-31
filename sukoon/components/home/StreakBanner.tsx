import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export const StreakBanner = () => {
  const { t } = useTranslation();
  const { streak, totalSessions } = useUserStore();
  const { colors } = useTheme();

  // Only show full banner for milestones (3+)
  if (streak < 3) return null;

  const milestoneEmoji = streak >= 30 ? '🏆' : streak >= 14 ? '⭐' : streak >= 7 ? '💎' : '🔥';
  const milestoneText = streak >= 30 ? 'Legendary!' : streak >= 14 ? 'On Fire!' : streak >= 7 ? 'Unstoppable!' : 'Building Habit!';

  return (
    <LinearGradient
      colors={colors.gradientPrimary as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.left}>
        <Text style={styles.emoji}>{milestoneEmoji}</Text>
        <View>
          <View style={styles.streakRow}>
            <Text style={styles.number}>{streak}</Text>
            <Text style={styles.label}> day streak</Text>
          </View>
          <Text style={styles.milestone}>{milestoneText}</Text>
        </View>
      </View>
      <View style={styles.statPill}>
        <Text style={styles.statValue}>{totalSessions}</Text>
        <Text style={styles.statLabel}>sessions</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 28,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  number: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  milestone: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginTop: 2,
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
});
