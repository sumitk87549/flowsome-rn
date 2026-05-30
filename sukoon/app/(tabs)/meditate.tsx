import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';

const DURATIONS = ['5 min', '10 min', '15 min', '20 min', '30 min'];
const CATEGORIES = [
  { id: 'sleep', label: 'Sleep', emoji: '🌙' },
  { id: 'focus', label: 'Focus', emoji: '🎯' },
  { id: 'stress', label: 'Stress Relief', emoji: '🔥' },
  { id: 'morning', label: 'Morning', emoji: '🌅' },
];

const MEDITATIONS = [
  { id: '1', title: 'Body Scan', duration: '10 min', category: 'sleep' },
  { id: '2', title: 'Box Breath Focus', duration: '5 min', category: 'focus' },
  { id: '3', title: 'Morning Gratitude', duration: '15 min', category: 'morning' },
  { id: '4', title: 'Sleep Story: Ranthambore', duration: '30 min', category: 'sleep' },
  { id: '5', title: 'SOS 3-Min Calm', duration: '5 min', category: 'stress' },
];

export default function MeditateScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedDuration, setSelectedDuration] = useState('10 min');

  const handlePress = () => {
    Alert.alert("Coming soon", t('coming_stage3'));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_meditate')} />
      <ScrollView contentContainerStyle={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {DURATIONS.map(dur => (
            <TouchableOpacity
              key={dur}
              style={[
                styles.pill,
                { 
                  backgroundColor: selectedDuration === dur ? colors.primary : 'transparent',
                  borderColor: selectedDuration === dur ? colors.primary : colors.border
                }
              ]}
              onPress={() => setSelectedDuration(dur)}
            >
              <Text style={[
                styles.pillText,
                { color: selectedDuration === dur ? 'white' : colors.textPrimary }
              ]}>{dur}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {CATEGORIES.map(cat => (
            <Card key={cat.id} style={styles.catCard}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {MEDITATIONS.map(item => (
            <Card key={item.id} style={styles.medCard} onPress={handlePress}>
              <View style={styles.medInfo}>
                <Text style={[styles.medTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <View style={styles.medBadges}>
                  <Badge label={item.duration} color={colors.primary} style={{ marginRight: 8 }} />
                  <Badge label={item.category} color={colors.accent} />
                </View>
              </View>
              <View style={[styles.playBtn, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="play" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 40 },
  horizontalScroll: { paddingHorizontal: 20, paddingVertical: 12, flexGrow: 0 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  pillText: { fontWeight: '600' },
  catCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  catEmoji: { fontSize: 18 },
  catLabel: { fontWeight: '600' },
  list: { paddingHorizontal: 20, marginTop: 12, gap: 12 },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  medInfo: { flex: 1 },
  medTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  medBadges: { flexDirection: 'row' },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
