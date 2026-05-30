import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { GreetingCard } from '../../components/home/GreetingCard';
import { StreakBanner } from '../../components/home/StreakBanner';
import { MoodCheckIn } from '../../components/home/MoodCheckIn';
import { QuickActionGrid } from '../../components/home/QuickActionGrid';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { Card } from '../../components/ui/Card';

const TIPS = [
  "5 deep breaths activate your parasympathetic nervous system",
  "25 minutes of focused work is backed by neuroscience (Pomodoro)",
  "Morning meditation improves focus for up to 4 hours",
  "Alternate nostril breathing activates both brain hemispheres",
  "Consistent sleep routine improves focus more than coffee"
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { moodHistory } = useUserStore();
  const [tipOfTheDay, setTipOfTheDay] = useState(TIPS[0]);

  useEffect(() => {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setTipOfTheDay(randomTip);
  }, []);

  const hasLoggedMoodToday = () => {
    if (moodHistory.length === 0) return false;
    const lastLog = new Date(moodHistory[moodHistory.length - 1].timestamp);
    const today = new Date();
    return lastLog.toDateString() === today.toDateString();
  };

  const renderRecommendedCard = () => {
    if (!hasLoggedMoodToday()) return null;
    
    const lastMood = moodHistory[moodHistory.length - 1].mood;
    let rec = { title: "🧘 Body Scan Meditation • 10 min • Deepen Calm" };
    if (lastMood <= 2) {
      rec.title = "🌬️ Box Breathing • 5 min • Stress Relief";
    } else if (lastMood === 3) {
      rec.title = "🎯 Classic Pomodoro • 25 min • Build Focus";
    }

    return (
      <Card style={[styles.recCard, { borderLeftColor: colors.primary }]}>
        <Text style={[styles.recTitle, { color: colors.textPrimary }]}>{t('recommended_label')}</Text>
        <Text style={[styles.recDesc, { color: colors.textSecondary }]}>{rec.title}</Text>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <GreetingCard />
        <StreakBanner />
        <MoodCheckIn />
        {renderRecommendedCard()}
        <QuickActionGrid />
        
        <Card style={styles.tipCard} variant="surfaceAlt">
          <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>💡 {t('daily_tip')}</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tipOfTheDay}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  recCard: {
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  recDesc: {
    fontSize: 14,
  },
  tipCard: {
    padding: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    fontStyle: 'italic',
  }
});