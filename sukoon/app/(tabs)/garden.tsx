import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useUserStore } from '../../stores/userStore';
import { useSessionStore } from '../../stores/sessionStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function GardenScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { streak, totalSessions, moodHistory, weeklyActivity } = useUserStore();
  const { getTotalMinutes, getAllSessions } = useSessionStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Spring animation for mandala on mount
    Animated.spring(ringScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 8,
      bounciness: 12,
    }).start();
  }, []);

  const rings = Math.min(Math.floor(totalSessions / 5) + 1, 5);
  const opacity = Math.min(0.3 + (totalSessions * 0.05), 1);

  // Weekly Heatmap
  const getHeatmapColors = () => {
    const today = new Date();
    const days = [];
    const oneDay = 24 * 60 * 60 * 1000;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * oneDay);
      const dayStr = d.toDateString();
      const count = weeklyActivity[dayStr] || 0;

      let color = colors.border;
      let glow = false;
      if (count === 1) { color = '#66BB6A'; }
      if (count === 2) { color = '#43A047'; glow = true; }
      if (count >= 3) { color = '#2E7D32'; glow = true; }

      days.push({
        id: dayStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        color,
        glow,
        count,
        isToday: i === 0,
      });
    }
    return days;
  };

  // Mood trend
  const getMoodPoints = () => {
    const recent = [...moodHistory].slice(-7);
    if (recent.length === 0) return "";
    const stepX = 200 / (Math.max(recent.length - 1, 1));
    const points = recent.map((m, i) => {
      const x = i * stepX;
      const y = 80 - ((m.mood - 1) * 15);
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  const sessions = getAllSessions().slice(0, 5);
  const totalMins = getTotalMinutes();

  const getSessionIcon = (type: string) => {
    if (type === 'focus') return { icon: 'timer', color: '#F4A44A' };
    if (type === 'breathe') return { icon: 'leaf', color: '#4DB896' };
    return { icon: 'moon', color: '#A855F7' };
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('nav_garden')}
        rightIcon={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} onPress={() => router.push('/history')} />
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { value: streak, label: 'Streak', emoji: '🔥' },
            { value: totalSessions, label: 'Sessions', emoji: '🧘' },
            { value: totalMins, label: 'Minutes', emoji: '⏱️' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Heatmap */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>This Week</Text>
          <View style={[styles.heatmapCard, { backgroundColor: colors.surface }]}>
            <View style={styles.heatmapRow}>
              {getHeatmapColors().map((day, i) => (
                <View key={i} style={styles.heatmapItem}>
                  <View style={[
                    styles.heatmapBox,
                    { backgroundColor: day.color },
                    day.glow && {
                      shadowColor: day.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.4,
                      shadowRadius: 6,
                      elevation: 3,
                    },
                    day.isToday && { borderWidth: 2, borderColor: colors.primary },
                  ]}>
                    {day.count > 0 && (
                      <Text style={styles.heatmapCount}>{day.count}</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.heatmapLabel,
                    { color: day.isToday ? colors.primary : colors.textTertiary }
                  ]}>{day.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Mandala Garden */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Garden</Text>
          <View style={[styles.mandalaCard, { backgroundColor: colors.surface }]}>
            <Animated.View style={{ transform: [{ scale: ringScale }] }}>
              <Svg height="180" width="180" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="8" fill={colors.primary} opacity={opacity} />
                {Array.from({ length: rings }).map((_, i) => (
                  <React.Fragment key={i}>
                    <Circle
                      cx="50" cy="50" r={18 + (i * 8)}
                      stroke={colors.primary}
                      strokeWidth="0.8"
                      fill="none"
                      opacity={opacity - (i * 0.12)}
                    />
                    {Array.from({ length: 6 + (i * 3) }).map((_, j) => {
                      const angle = (j * 360) / (6 + (i * 3));
                      return (
                        <Path
                          key={`petal-${i}-${j}`}
                          d={`M 50 ${50 - (10 + (i * 8))} Q 54 ${50 - (18 + (i * 8))} 50 ${50 - (26 + (i * 8))} Q 46 ${50 - (18 + (i * 8))} 50 ${50 - (10 + (i * 8))}`}
                          stroke={colors.primary}
                          strokeWidth="0.4"
                          fill="none"
                          opacity={opacity}
                          transform={`rotate(${angle} 50 50)`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </Svg>
            </Animated.View>
            <Text style={[styles.mandalaLevel, { color: colors.textSecondary }]}>
              {totalSessions === 0 ? 'Complete sessions to grow' : `Level ${rings} · ${5 * rings - totalSessions > 0 ? `${5 * rings - totalSessions} sessions to next level` : 'Evolving'}`}
            </Text>
          </View>
        </View>

        {/* Mood Trend */}
        {moodHistory.length > 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Mood Trend</Text>
            <View style={[styles.moodCard, { backgroundColor: colors.surface }]}>
              <Svg height="80" width="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                <Polyline
                  points={getMoodPoints()}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {getMoodPoints().split(' ').map((pt, i) => (
                  <Circle
                    key={i}
                    cx={pt.split(',')[0]}
                    cy={pt.split(',')[1]}
                    r="3.5"
                    fill={colors.background}
                    stroke={colors.primary}
                    strokeWidth="2"
                  />
                ))}
              </Svg>
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Recent</Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.sessionsCard, { backgroundColor: colors.surface }]}>
              {sessions.map((s, index) => {
                const { icon, color } = getSessionIcon(s.type);
                const title = s.type === 'focus' ? `Focus · ${s.mode}` :
                              s.type === 'breathe' ? 'Breathing' : 'Meditation';
                const duration = s.type === 'focus' ? s.actualDuration :
                                s.type === 'breathe' ? Math.round(s.duration / 60) : s.duration;

                return (
                  <View key={s.id} style={[
                    styles.sessionItem,
                    index < sessions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}>
                    <View style={styles.sessionLeft}>
                      <View style={[styles.sessionIconBg, { backgroundColor: `${color}18` }]}>
                        <Ionicons name={icon as any} size={16} color={color} />
                      </View>
                      <View>
                        <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>{title}</Text>
                        <Text style={[styles.sessionDate, { color: colors.textTertiary }]}>
                          {new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.sessionDuration, { color: colors.textSecondary }]}>{duration}m</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  // Sections
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAll: { fontSize: 13, fontWeight: '600' },

  // Heatmap
  heatmapCard: { borderRadius: 16, padding: 16 },
  heatmapRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heatmapItem: { alignItems: 'center', gap: 6 },
  heatmapBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapCount: { color: 'white', fontSize: 11, fontWeight: '700' },
  heatmapLabel: { fontSize: 10, fontWeight: '700' },

  // Mandala
  mandalaCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  mandalaLevel: { fontSize: 13, fontWeight: '500', marginTop: 12, fontStyle: 'italic' },

  // Mood
  moodCard: { borderRadius: 16, padding: 16, height: 110 },

  // Sessions
  sessionsCard: { borderRadius: 16, overflow: 'hidden' },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 1 },
  sessionDate: { fontSize: 11, fontWeight: '500' },
  sessionDuration: { fontSize: 15, fontWeight: '700' },
});
