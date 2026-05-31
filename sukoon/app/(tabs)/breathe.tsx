import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BREATHING_TECHNIQUES } from '../../constants/breathing';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [showAllTechniques, setShowAllTechniques] = useState(false);

  const handleStart = (id: string) => {
    router.push(`/session/breathe?id=${id}`);
  };

  // Sort techniques: recommended ones first
  const sortedTechniques = [...BREATHING_TECHNIQUES].sort((a, b) => {
    const aMatch = a.goal.includes(selectedGoal) ? 1 : 0;
    const bMatch = b.goal.includes(selectedGoal) ? 1 : 0;
    return bMatch - aMatch;
  });

  const recommended = sortedTechniques.filter(t => t.goal.includes(selectedGoal));
  const others = sortedTechniques.filter(t => !t.goal.includes(selectedGoal));

  const getGradient = (color: string): [string, string] => {
    // Darken the technique color for gradient
    return [color, `${color}88`];
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_breathe')} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Goal Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsScroll} contentContainerStyle={styles.goalsContent}>
          {GOALS.map(goal => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalPill,
                {
                  backgroundColor: selectedGoal === goal.id ? colors.primarySoft : 'transparent',
                  borderColor: selectedGoal === goal.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedGoal(goal.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <Text style={[
                styles.goalText,
                { color: selectedGoal === goal.id ? colors.primary : colors.textPrimary }
              ]}>{goal.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recommended Techniques (large cards) */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>RECOMMENDED</Text>
        <View style={styles.recommendedList}>
          {recommended.map(tech => (
            <TouchableOpacity
              key={tech.id}
              style={styles.recCardWrapper}
              onPress={() => handleStart(tech.id)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[`${tech.color}20`, `${tech.color}08`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.recCard, { borderColor: `${tech.color}30` }]}
              >
                <View style={styles.recCardTop}>
                  <View style={styles.recCardInfo}>
                    <Text style={[styles.recCardName, { color: colors.textPrimary }]}>{tech.name}</Text>
                    <Text style={[styles.recCardSanskrit, { color: colors.textTertiary }]}>{tech.sanskritName}</Text>
                  </View>
                  <View style={[styles.patternPill, { borderColor: tech.color }]}>
                    <Text style={[styles.patternText, { color: tech.color }]}>{tech.pattern.join('-')}</Text>
                  </View>
                </View>

                <View style={styles.recCardBottom}>
                  <View style={[styles.effectBadge, { backgroundColor: `${tech.color}18` }]}>
                    <Text style={[styles.effectText, { color: tech.color }]}>{tech.effect}</Text>
                  </View>
                  <View style={[styles.playCircle, { backgroundColor: tech.color }]}>
                    <Ionicons name="play" size={16} color="white" style={{ marginLeft: 1 }} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Techniques (compact) */}
        {others.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.moreToggle}
              onPress={() => setShowAllTechniques(!showAllTechniques)}
            >
              <Text style={[styles.moreToggleText, { color: colors.textTertiary }]}>
                {showAllTechniques ? 'Show less' : `${others.length} more techniques`}
              </Text>
              <Ionicons name={showAllTechniques ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            {showAllTechniques && (
              <View style={styles.othersList}>
                {others.map(tech => (
                  <TouchableOpacity
                    key={tech.id}
                    style={[styles.otherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleStart(tech.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.otherCardLeft}>
                      <View style={[styles.colorDot, { backgroundColor: tech.color }]} />
                      <View>
                        <Text style={[styles.otherName, { color: colors.textPrimary }]}>{tech.name}</Text>
                        <Text style={[styles.otherEffect, { color: colors.textTertiary }]}>{tech.effect}</Text>
                      </View>
                    </View>
                    <View style={styles.otherRight}>
                      <Text style={[styles.otherPattern, { color: tech.color }]}>{tech.pattern.join('-')}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 20 },

  // Goals
  goalsScroll: { flexGrow: 0, marginBottom: 20 },
  goalsContent: { paddingHorizontal: 20, gap: 10 },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  goalEmoji: { fontSize: 16 },
  goalText: { fontWeight: '600', fontSize: 14 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  // Recommended cards
  recommendedList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  recCardWrapper: {},
  recCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  recCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recCardInfo: {},
  recCardName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  recCardSanskrit: { fontSize: 12, fontWeight: '500', fontStyle: 'italic' },
  patternPill: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  patternText: { fontWeight: '700', fontSize: 13, letterSpacing: 1 },

  recCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  effectBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  effectText: { fontWeight: '600', fontSize: 12 },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // More toggle
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  moreToggleText: { fontSize: 13, fontWeight: '600' },

  // Others list (compact)
  othersList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  otherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  otherCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  otherName: { fontSize: 15, fontWeight: '600' },
  otherEffect: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  otherRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  otherPattern: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});
