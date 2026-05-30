import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../stores/appStore';
import { Ionicons } from '@expo/vector-icons';

export const GreetingCard = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { toggleLanguage, toggleColorScheme, language } = useAppStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `🌅 ${t('greeting_morning')}`;
    if (hour >= 12 && hour < 17) return `🙏 ${t('greeting_afternoon')}`;
    if (hour >= 17 && hour < 21) return `🌆 ${t('greeting_evening')}`;
    return `🌙 ${t('greeting_night')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>{getGreeting()}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.pill, { backgroundColor: colors.surface }]} onPress={toggleLanguage}>
          <Text style={[styles.pillText, { color: colors.textPrimary }]}>{language === 'en' ? 'EN' : 'हिं'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface }]} onPress={toggleColorScheme}>
          <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    fontWeight: '600',
    fontSize: 14,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
