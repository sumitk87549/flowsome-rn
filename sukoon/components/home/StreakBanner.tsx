import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

export const StreakBanner = () => {
  const { t } = useTranslation();
  const { streak } = useUserStore();
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <Text style={styles.emoji}>🔥</Text>
      <View style={styles.textContainer}>
        {streak > 0 ? (
          <>
            <Text style={styles.number}>{streak}</Text>
            <Text style={styles.label}>{t('streak_days')}</Text>
          </>
        ) : (
          <Text style={styles.startLabel}>{t('streak_label')}</Text>
        )}
      </View>
      <Ionicons name="calendar-outline" size={24} color="rgba(255,255,255,0.7)" />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 32,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  number: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  startLabel: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  }
});
