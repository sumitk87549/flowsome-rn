import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ACTIONS = [
  {
    id: 'focus',
    icon: 'timer-outline' as const,
    labelKey: 'quick_focus',
    subtitle: '25 min · Pomodoro',
    route: '/(tabs)/focus',
    gradient: ['#2D8B6F', '#1A5C49'],
    emoji: '🎯',
  },
  {
    id: 'breathe',
    icon: 'leaf-outline' as const,
    labelKey: 'quick_breathe',
    subtitle: '5 min · Guided',
    route: '/(tabs)/breathe',
    gradient: ['#4DB896', '#2D8B6F'],
    emoji: '🌿',
  },
  {
    id: 'meditate',
    icon: 'moon-outline' as const,
    labelKey: 'quick_meditate',
    subtitle: '10 min · Calm',
    route: '/(tabs)/meditate',
    gradient: ['#6C5CE7', '#4A3D9E'],
    emoji: '🧘',
  },
];

export const QuickActionGrid = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Start</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.cardWrapper}
            onPress={() => router.push(action.route)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={action.gradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardEmoji}>{action.emoji}</Text>
              </View>
              <Text style={styles.cardLabel}>{t(action.labelKey)}</Text>
              <Text style={styles.cardSubtitle}>{action.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 4,
  },
  cardWrapper: {
    width: 130,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    height: 140,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 20,
  },
  cardLabel: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
});
