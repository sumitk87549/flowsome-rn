import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';

const MOODS = [
  { value: 1, emoji: '😰', label: 'Stressed' },
  { value: 2, emoji: '😟', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export const MoodCheckIn = () => {
  const { t } = useTranslation();
  const { logMood, moodHistory } = useUserStore();
  const { colors } = useTheme();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const checkAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(MOODS.map(() => new Animated.Value(1))).current;

  // Check if already logged today
  const hasLoggedToday = () => {
    if (moodHistory.length === 0) return false;
    const last = new Date(moodHistory[moodHistory.length - 1].timestamp);
    return last.toDateString() === new Date().toDateString();
  };

  const [alreadyLogged] = useState(hasLoggedToday());

  const handleMoodSelect = (value: number, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Bounce animation
    Animated.sequence([
      Animated.spring(scaleAnims[index], { toValue: 1.3, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(scaleAnims[index], { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();

    setSelectedMood(value);
    logMood(value);

    // Show checkmark
    Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }).start();
  };

  if (alreadyLogged && !selectedMood) {
    return (
      <View style={[styles.loggedContainer, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.loggedText, { color: colors.primary }]}>✓ Mood logged today</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('mood_question')}</Text>
        <Animated.Text style={[styles.checkMark, { color: colors.success, opacity: checkAnim, transform: [{ scale: checkAnim }] }]}>
          ✓
        </Animated.Text>
      </View>
      <View style={styles.emojiRow}>
        {MOODS.map((mood, index) => {
          const isSelected = selectedMood === mood.value;
          return (
            <TouchableOpacity
              key={mood.value}
              style={[
                styles.emojiButton,
                {
                  backgroundColor: isSelected ? colors.primarySoft : 'transparent',
                  borderColor: isSelected ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleMoodSelect(mood.value, index)}
              activeOpacity={0.7}
            >
              <Animated.Text style={[styles.emoji, { transform: [{ scale: scaleAnims[index] }] }]}>
                {mood.emoji}
              </Animated.Text>
              <Text style={[styles.emojiLabel, { color: isSelected ? colors.primary : colors.textTertiary }]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emojiButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    flex: 1,
    marginHorizontal: 3,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Already logged state
  loggedContainer: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  loggedText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
