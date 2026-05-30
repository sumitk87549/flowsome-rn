import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BREATHING_TECHNIQUES } from '../../constants/breathing';
import { useUserStore } from '../../stores/userStore';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

const GOALS = ['calm', 'focus', 'sleep', 'energy'];

export default function BreatheScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { selectedBreathGoal, setSelectedBreathGoal } = useUserStore();

  const handlePress = () => {
    Alert.alert("Coming soon", "Full animation coming in Stage 2!");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_breathe')} />
      <ScrollView contentContainerStyle={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesScroll}>
          {GOALS.map(goal => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.modePill,
                { 
                  backgroundColor: selectedBreathGoal === goal ? colors.primary : 'transparent',
                  borderColor: selectedBreathGoal === goal ? colors.primary : colors.border
                }
              ]}
              onPress={() => setSelectedBreathGoal(goal)}
            >
              <Text style={[
                styles.modeText,
                { color: selectedBreathGoal === goal ? 'white' : colors.textPrimary, textTransform: 'capitalize' }
              ]}>{goal}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {BREATHING_TECHNIQUES.map(tech => (
            <Card key={tech.id} style={styles.card} onPress={handlePress}>
              <View style={[styles.ratioPill, { borderColor: colors.primary }]}>
                <Text style={[styles.ratioText, { color: colors.primary }]}>{tech.pattern.join('-')}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.techName, { color: colors.textPrimary }]}>{tech.name}</Text>
                <Text style={[styles.sanskritName, { color: colors.textSecondary }]}>{tech.sanskritName}</Text>
              </View>
              <Badge label={tech.effect} color={tech.color} />
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
  modesScroll: { paddingHorizontal: 20, paddingVertical: 16, flexGrow: 0 },
  modePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  modeText: { fontWeight: '600' },
  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  ratioPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 16,
  },
  ratioText: { fontWeight: 'bold', fontSize: 12 },
  textContainer: { flex: 1 },
  techName: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  sanskritName: { fontSize: 12, fontStyle: 'italic' },
});
