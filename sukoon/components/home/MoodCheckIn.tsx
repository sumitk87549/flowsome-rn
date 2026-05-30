import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import * as Haptics from 'expo-haptics';

const MOODS = [
  { value: 1, emoji: '😰', label: 'mood_very_stressed' },
  { value: 2, emoji: '😟', label: 'mood_stressed' },
  { value: 3, emoji: '😐', label: 'mood_neutral' },
  { value: 4, emoji: '🙂', label: 'mood_good' },
  { value: 5, emoji: '😄', label: 'mood_great' },
];

export const MoodCheckIn = () => {
  const { t } = useTranslation();
  const { logMood } = useUserStore();
  const { colors } = useTheme();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [showLogged, setShowLogged] = useState(false);

  const handleMoodSelect = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMood(value);
    logMood(value);
    setShowLogged(true);
    setTimeout(() => {
      setShowLogged(false);
    }, 1500);
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('mood_question')}</Text>
        {showLogged && <Text style={[styles.loggedText, { color: colors.success }]}>{t('logged')}</Text>}
      </View>
      <View style={styles.emojiRow}>
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.value;
          return (
            <TouchableOpacity
              key={mood.value}
              style={[
                styles.emojiButton,
                { backgroundColor: isSelected ? colors.accentLight : colors.border }
              ]}
              onPress={() => handleMoodSelect(mood.value)}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  loggedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  }
});
