import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StreakBanner } from '../../components/home/StreakBanner';
import Svg, { Circle, Path } from 'react-native-svg';
import { useUserStore } from '../../stores/userStore';

export default function GardenScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { streak } = useUserStore();

  const opacity = Math.min(0.2 + (streak * 0.1), 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_garden')} />
      <ScrollView contentContainerStyle={styles.container}>
        <StreakBanner />

        <View style={styles.mandalaContainer}>
          <Svg height="200" width="200" viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="40" stroke={colors.primary} strokeWidth="1" fill="none" opacity={opacity} />
            <Circle cx="50" cy="50" r="30" stroke={colors.primary} strokeWidth="1" fill="none" opacity={opacity} />
            <Path
              d="M 50 10 Q 60 50 50 90 Q 40 50 50 10"
              stroke={colors.primary}
              strokeWidth="1"
              fill="none"
              opacity={opacity}
            />
            <Path
              d="M 10 50 Q 50 60 90 50 Q 50 40 10 50"
              stroke={colors.primary}
              strokeWidth="1"
              fill="none"
              opacity={opacity}
            />
            <Path
              d="M 21.7 21.7 Q 50 50 78.3 78.3 M 21.7 78.3 Q 50 50 78.3 21.7"
              stroke={colors.primary}
              strokeWidth="1"
              fill="none"
              opacity={opacity}
            />
          </Svg>
          <Text style={[styles.mandalaText, { color: colors.textSecondary }]}>
            Your Mandala Garden grows with every session
          </Text>
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions this week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total minutes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best streak</Text>
          </View>
        </View>

        <Text style={[styles.comingSoon, { color: colors.primary }]}>Coming in Stage 3: Full insights & history 🌱</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  mandalaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  mandalaText: {
    fontStyle: 'italic',
    marginTop: 20,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 12,
  },
  comingSoon: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  }
});
