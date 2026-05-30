import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { PillButton } from '../../components/ui/PillButton';
import { useTheme } from '../../hooks/useTheme';

export default function Step1Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { goals, setGoals } = useUserStore();
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>(goals);

  const goalOptions = [
    { id: 'stress', label: t('onb_goals_stress'), emoji: '😰' },
    { id: 'sleep', label: t('onb_goals_sleep'), emoji: '🌙' },
    { id: 'focus', label: t('onb_goals_focus'), emoji: '🎯' },
    { id: 'anxiety', label: t('onb_goals_anxiety'), emoji: '🍃' },
    { id: 'habit', label: t('onb_goals_habit'), emoji: '📅' },
  ];

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    setGoals(selectedGoals);
    router.push('/onboarding/step2');
  };

  return (
    <LinearGradient colors={['#FF8C42', '#1A3A5C']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSection}>
          <Text style={styles.hindiTitle}>सुकून</Text>
          <Text style={styles.engTitle}>Sukoon</Text>
          <Text style={styles.tagline}>शांति • शक्ति • सुकून</Text>
          <View style={styles.separator} />
        </View>

        <View style={styles.middleSection}>
          <Text style={styles.question}>{t('onb_step1_title')}</Text>
          <Text style={styles.subtitle}>{t('onb_step1_subtitle')}</Text>
          
          <View style={styles.pillContainer}>
            {goalOptions.map(option => (
              <PillButton
                key={option.id}
                label={option.label}
                emoji={option.emoji}
                selected={selectedGoals.includes(option.id)}
                onPress={() => toggleGoal(option.id)}
                variant="onboarding"
                style={styles.pill}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.progress}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          
          <TouchableOpacity 
            style={[styles.nextButton, selectedGoals.length === 0 && styles.nextButtonDisabled]}
            disabled={selectedGoals.length === 0}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, { color: colors.primary }]}>{t('next_button')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between', padding: 24 },
  topSection: { alignItems: 'center', marginTop: 40 },
  hindiTitle: { fontSize: 48, color: 'white', fontFamily: 'NotoSansDevanagari_600SemiBold' },
  engTitle: { fontSize: 22, color: 'rgba(255,255,255,0.8)' },
  tagline: { fontSize: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  separator: { width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 20 },
  middleSection: { flex: 1, justifyContent: 'center' },
  question: { fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  pill: { marginBottom: 12 },
  bottomSection: { alignItems: 'center', marginBottom: 20 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: 'white' },
  dotActive: { backgroundColor: 'white' },
  nextButton: { backgroundColor: 'white', paddingVertical: 16, width: '100%', borderRadius: 12, alignItems: 'center' },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { fontSize: 16, fontWeight: 'bold' }
});
