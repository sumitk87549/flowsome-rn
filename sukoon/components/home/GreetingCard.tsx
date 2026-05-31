import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../stores/appStore';
import { useUserStore } from '../../stores/userStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const GreetingCard = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { toggleLanguage, language } = useAppStore();
  const { streak } = useUserStore();
  const router = useRouter();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fireScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle shimmer on greeting
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Fire pulse for streak
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(fireScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [streak]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greeting_morning');
    if (hour >= 12 && hour < 17) return t('greeting_afternoon');
    if (hour >= 17 && hour < 21) return t('greeting_evening');
    return t('greeting_night');
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '☀️';
    if (hour >= 12 && hour < 17) return '🙏';
    if (hour >= 17 && hour < 21) return '🌅';
    return '🌙';
  };

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <View style={styles.container}>
      {/* Top row: greeting + actions */}
      <View style={styles.topRow}>
        <Animated.Text style={[styles.greeting, { color: colors.textPrimary, opacity: shimmerOpacity }]}>
          {getGreetingEmoji()} {getGreeting()}
        </Animated.Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.pill, { backgroundColor: colors.glassSurface, borderColor: colors.glassStroke, borderWidth: 1 }]}
            onPress={toggleLanguage}
          >
            <Text style={[styles.pillText, { color: colors.textSecondary }]}>
              {language === 'en' ? 'EN' : 'हिं'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.glassSurface, borderColor: colors.glassStroke, borderWidth: 1 }]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Streak inline (if active) */}
      {streak > 0 && (
        <View style={[styles.streakInline, { backgroundColor: colors.primarySoft }]}>
          <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: fireScale }] }]}>🔥</Animated.Text>
          <Text style={[styles.streakText, { color: colors.primary }]}>
            {streak} day streak
          </Text>
          <Text style={[styles.streakSub, { color: colors.textTertiary }]}>
            {streak >= 7 ? '· Amazing!' : streak >= 3 ? '· Keep going!' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pillText: {
    fontWeight: '600',
    fontSize: 12,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Streak inline
  streakInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  fireEmoji: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
  },
  streakSub: {
    fontSize: 12,
    fontWeight: '500',
  },
});
