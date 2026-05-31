import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GreetingCard } from '../../components/home/GreetingCard';
import { StreakBanner } from '../../components/home/StreakBanner';
import { MoodCheckIn } from '../../components/home/MoodCheckIn';
import { QuickActionGrid } from '../../components/home/QuickActionGrid';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { moodHistory } = useUserStore();
  const router = useRouter();

  // Recommended session based on time + mood
  const getRecommendation = () => {
    const hour = new Date().getHours();
    const lastMood = moodHistory.length > 0 ? moodHistory[moodHistory.length - 1].mood : 3;
    const loggedToday = moodHistory.length > 0 &&
      new Date(moodHistory[moodHistory.length - 1].timestamp).toDateString() === new Date().toDateString();

    if (loggedToday && lastMood <= 2) {
      return {
        title: 'SOS — 3 Min Calm',
        subtitle: 'Quick stress relief breathing',
        emoji: '🌬️',
        gradient: ['#6C5CE7', '#4A3D9E'] as [string, string],
        route: '/session/breathe',
        params: { id: 'box' },
        duration: '3 min',
      };
    }
    if (hour >= 5 && hour < 10) {
      return {
        title: 'Morning Gratitude',
        subtitle: 'Start your day mindfully',
        emoji: '🌅',
        gradient: ['#F4A44A', '#E8832A'] as [string, string],
        route: '/session/meditate',
        params: { id: 'morning-gratitude', lang: 'en' },
        duration: '5 min',
      };
    }
    if (hour >= 10 && hour < 18) {
      return {
        title: 'Focus Session',
        subtitle: 'Deep work with ambient sounds',
        emoji: '🎯',
        gradient: ['#2D8B6F', '#1A5C49'] as [string, string],
        route: '/session/focus',
        params: { modeId: 'classic', themeId: 'ganga', work: 25, break: 5, cycles: 4 },
        duration: '25 min',
      };
    }
    return {
      title: 'Body Scan',
      subtitle: 'Unwind and release tension',
      emoji: '🌙',
      gradient: ['#2A1A4A', '#1A0B2E'] as [string, string],
      route: '/session/meditate',
      params: { id: 'body-scan', lang: 'en' },
      duration: '10 min',
    };
  };

  const rec = getRecommendation();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <GreetingCard />
        <StreakBanner />
        <MoodCheckIn />

        {/* Recommended Hero Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: rec.route as any, params: rec.params })}
        >
          <LinearGradient
            colors={rec.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroTextArea}>
                <Text style={styles.heroLabel}>Recommended for you</Text>
                <Text style={styles.heroTitle}>{rec.emoji} {rec.title}</Text>
                <Text style={styles.heroSubtitle}>{rec.subtitle}</Text>
              </View>
              <View style={styles.heroPlayArea}>
                <View style={styles.heroDuration}>
                  <Text style={styles.heroDurationText}>{rec.duration}</Text>
                </View>
                <View style={styles.heroPlayBtn}>
                  <Ionicons name="play" size={22} color={rec.gradient[0]} style={{ marginLeft: 2 }} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <QuickActionGrid />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 30,
  },
  // Hero recommendation
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    minHeight: 130,
    justifyContent: 'center',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextArea: {
    flex: 1,
    paddingRight: 16,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  heroPlayArea: {
    alignItems: 'center',
    gap: 8,
  },
  heroDuration: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroDurationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
  },
  heroPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});