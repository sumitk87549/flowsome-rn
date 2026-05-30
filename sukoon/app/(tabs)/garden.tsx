import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StreakBanner } from '../../components/home/StreakBanner';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useUserStore } from '../../stores/userStore';
import { useSessionStore } from '../../stores/sessionStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function GardenScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  
  const { streak, totalSessions, moodHistory, weeklyActivity } = useUserStore();
  const { getTotalMinutes, getAllSessions } = useSessionStore();
  
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // Mandala growth calculation
  const rings = Math.min(Math.floor(totalSessions / 5) + 1, 5); // Max 5 rings
  const opacity = Math.min(0.2 + (totalSessions * 0.05), 1);

  // Weekly Heatmap Data
  const getHeatmapColors = () => {
    const today = new Date();
    const days = [];
    const oneDay = 24 * 60 * 60 * 1000;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * oneDay);
      const dayStr = d.toDateString();
      const count = weeklyActivity[dayStr] || 0;
      
      let color = colors.border;
      if (count === 1) color = '#A5D6A7';
      if (count === 2) color = '#66BB6A';
      if (count >= 3) color = '#2E7D32';
      
      days.push({ id: dayStr, label: d.toLocaleDateString('en-US', { weekday: 'short' })[0], color });
    }
    return days;
  };

  // Mood trend (0-4 mapping)
  const getMoodPoints = () => {
    // Only get recent 7 moods
    const recent = [...moodHistory].slice(-7);
    if (recent.length === 0) return "";
    
    const stepX = 200 / (Math.max(recent.length - 1, 1));
    const points = recent.map((m, i) => {
      const x = i * stepX;
      // mood 1-5 maps to y 80-20
      const y = 80 - ((m.mood - 1) * 15);
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  const sessions = getAllSessions().slice(0, 10);
  const totalMins = getTotalMinutes();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader 
        title={t('nav_garden')} 
        rightIcon={
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Ionicons name="time-outline" size={24} color={colors.textPrimary} onPress={() => router.push('/history')} />
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} onPress={() => router.push('/settings/notifications')} />
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Streak Gamification */}
        <View style={[styles.streakCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: pulseAnim }] }]}>🔥</Animated.Text>
          <View style={styles.streakTextContainer}>
            <Text style={[styles.streakTitle, { color: colors.textPrimary }]}>{streak} Day Streak</Text>
            <Text style={[styles.streakSub, { color: colors.textSecondary }]}>
              {streak > 0 ? "You're doing great! Keep the momentum." : "Start a session today to build your streak."}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalSessions}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalMins}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
          </View>
        </View>

        {/* Weekly Heatmap */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Weekly Consistency</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.heatmapRow}>
              {getHeatmapColors().map((day, i) => (
                <View key={i} style={styles.heatmapItem}>
                  <View style={[styles.heatmapBox, { backgroundColor: day.color }]} />
                  <Text style={[styles.heatmapLabel, { color: colors.textTertiary }]}>{day.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Mandala Garden */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Mandala Garden</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', paddingVertical: 40 }]}>
            <Svg height="200" width="200" viewBox="0 0 100 100">
              {/* Core */}
              <Circle cx="50" cy="50" r="10" fill={colors.primary} opacity={opacity} />
              
              {/* Rings */}
              {Array.from({ length: rings }).map((_, i) => (
                <React.Fragment key={i}>
                  <Circle cx="50" cy="50" r={20 + (i * 10)} stroke={colors.primary} strokeWidth="1" fill="none" opacity={opacity - (i * 0.1)} />
                  {Array.from({ length: 8 + (i * 4) }).map((_, j) => {
                    const angle = (j * 360) / (8 + (i * 4));
                    return (
                      <Path
                        key={`petal-${i}-${j}`}
                        d={`M 50 ${50 - (10 + (i * 10))} Q 55 ${50 - (20 + (i * 10))} 50 ${50 - (30 + (i * 10))} Q 45 ${50 - (20 + (i * 10))} 50 ${50 - (10 + (i * 10))}`}
                        stroke={colors.primary}
                        strokeWidth="0.5"
                        fill="none"
                        opacity={opacity}
                        transform={`rotate(${angle} 50 50)`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </Svg>
            <Text style={[styles.mandalaText, { color: colors.textSecondary }]}>
              {totalSessions === 0 ? "Complete sessions to grow your garden" : `Garden Level ${rings} • Evolving`}
            </Text>
          </View>
        </View>

        {/* Mood Trend */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Mood Trend</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, height: 120 }]}>
            {moodHistory.length > 1 ? (
              <Svg height="100%" width="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                <Polyline
                  points={getMoodPoints()}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="3"
                />
                {/* Draw points */}
                {getMoodPoints().split(' ').map((pt, i) => (
                  <Circle key={i} cx={pt.split(',')[0]} cy={pt.split(',')[1]} r="4" fill={colors.background} stroke={colors.accent} strokeWidth="2" />
                ))}
              </Svg>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>Log more moods to see trends</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Sessions Preview */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Recent Sessions</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
            {sessions.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>No sessions yet.</Text>
              </View>
            ) : (
              sessions.map((s, index) => {
                let title = '';
                let color = '';
                if (s.type === 'focus') { title = `Focus: ${s.mode}`; color = '#F4A44A'; }
                if (s.type === 'breathe') { title = `Breathing`; color = '#2D8B6F'; }
                if (s.type === 'meditate') { title = `Meditation`; color = '#A855F7'; }

                return (
                  <View key={s.id} style={[styles.sessionItem, index < sessions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      <View>
                        <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>{title}</Text>
                        <Text style={[styles.sessionDate, { color: colors.textTertiary }]}>{new Date(s.startTime).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.sessionDuration, { color: colors.textSecondary }]}>
                      {s.type === 'focus' ? s.actualDuration : s.type === 'breathe' ? Math.round(s.duration/60) : s.duration}m
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },
  
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  fireEmoji: { fontSize: 32, marginRight: 16 },
  streakTextContainer: { flex: 1 },
  streakTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  streakSub: { fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 12 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },

  heatmapRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heatmapItem: { alignItems: 'center', gap: 6 },
  heatmapBox: { width: 32, height: 32, borderRadius: 8 },
  heatmapLabel: { fontSize: 10, fontWeight: 'bold' },

  mandalaText: { fontStyle: 'italic', marginTop: 20, fontSize: 14 },

  sessionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  sessionTitle: { fontWeight: '600', fontSize: 16, marginBottom: 2 },
  sessionDate: { fontSize: 12 },
  sessionDuration: { fontWeight: 'bold' },
});
