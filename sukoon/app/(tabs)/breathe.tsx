import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BREATHING_TECHNIQUES } from '../../constants/breathing';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useRouter } from 'expo-router';

const GOALS = [
  { id: 'calm', label: 'Calm', emoji: '🧘' },
  { id: 'focus', label: 'Focus', emoji: '🎯' },
  { id: 'sleep', label: 'Sleep', emoji: '😴' },
  { id: 'energy', label: 'Energy', emoji: '⚡' },
];

export default function BreatheScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState('calm');

  const handleStart = (id: string) => {
    router.push(`/session/breathe?id=${id}`);
  };

  // Sort techniques: recommended ones first
  const sortedTechniques = [...BREATHING_TECHNIQUES].sort((a, b) => {
    const aMatch = a.goal.includes(selectedGoal) ? 1 : 0;
    const bMatch = b.goal.includes(selectedGoal) ? 1 : 0;
    return bMatch - aMatch;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_breathe')} />
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose your goal</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesScroll}>
          {GOALS.map(goal => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.modePill,
                { 
                  backgroundColor: selectedGoal === goal.id ? colors.primary : 'transparent',
                  borderColor: selectedGoal === goal.id ? colors.primary : colors.border
                }
              ]}
              onPress={() => setSelectedGoal(goal.id)}
            >
              <Text style={styles.modeEmoji}>{goal.emoji}</Text>
              <Text style={[
                styles.modeText,
                { color: selectedGoal === goal.id ? 'white' : colors.textPrimary }
              ]}>{goal.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {sortedTechniques.map(tech => {
            const isRecommended = tech.goal.includes(selectedGoal);
            return (
              <Card key={tech.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.techName, { color: colors.textPrimary }]}>{tech.name}</Text>
                      <Text style={[styles.nameHi, { color: colors.textSecondary }]}>{tech.nameHi}</Text>
                    </View>
                    <Text style={[styles.sanskritName, { color: colors.textTertiary }]}>{tech.sanskritName}</Text>
                  </View>
                  {isRecommended && (
                    <Badge label="✨ Recommended" color={colors.accent} />
                  )}
                </View>

                <View style={styles.ratioRow}>
                  <View style={[styles.ratioPill, { borderColor: tech.color }]}>
                    <Text style={[styles.ratioText, { color: tech.color }]}>{tech.pattern.join('-')}</Text>
                  </View>
                  <Badge label={tech.effect} color={tech.color} />
                </View>

                <Text style={[styles.science, { color: colors.textSecondary }]} numberOfLines={2}>
                  {tech.science}
                </Text>

                {tech.id === 'nadi' && (
                  <View style={[styles.nadiNote, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.nadiNoteText, { color: colors.primary }]}>Screen will guide which nostril to use</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.startBtn, { borderColor: colors.primary }]}
                  onPress={() => handleStart(tech.id)}
                >
                  <Text style={[styles.startBtnText, { color: colors.primary }]}>Start</Text>
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 40 },
  subtitle: { fontSize: 16, marginHorizontal: 20, marginBottom: 12, fontWeight: '500' },
  modesScroll: { paddingHorizontal: 20, marginBottom: 20, flexGrow: 0 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 12,
  },
  modeEmoji: { marginRight: 8, fontSize: 16 },
  modeText: { fontWeight: '600' },
  list: { paddingHorizontal: 20, gap: 16 },
  card: { padding: 16, borderRadius: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 },
  techName: { fontSize: 17, fontWeight: 'bold', marginRight: 8 },
  nameHi: { fontSize: 14, fontStyle: 'italic' },
  sanskritName: { fontSize: 13, fontWeight: '300', fontStyle: 'italic' },
  ratioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratioPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginRight: 12 },
  ratioText: { fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  science: { fontSize: 12, lineHeight: 18, marginBottom: 16 },
  nadiNote: { padding: 10, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  nadiNoteText: { fontSize: 12, fontWeight: '600' },
  startBtn: { width: '100%', paddingVertical: 12, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  startBtnText: { fontWeight: 'bold', fontSize: 16 },
});
