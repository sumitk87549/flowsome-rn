import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function Step2Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { timePreference, setTimePreference } = useUserStore();
  
  const [selectedTime, setSelectedTime] = useState<string>(timePreference || '15-20 Minutes');

  const timeOptions = [
    { id: '5-10 Minutes', emoji: '⚡', title: t('onb_time_quick'), subtitle: t('onb_time_quick_sub') },
    { id: '15-20 Minutes', emoji: '🌿', title: t('onb_time_regular'), subtitle: t('onb_time_regular_sub') },
    { id: '30+ Minutes', emoji: '🧘', title: t('onb_time_deep'), subtitle: t('onb_time_deep_sub') },
  ];

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTime(id);
  };

  const handleNext = () => {
    setTimePreference(selectedTime);
    router.push('/onboarding/step3');
  };

  return (
    <LinearGradient colors={['#FF8C42', '#1A3A5C']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.middleSection}>
          <Text style={styles.question}>{t('onb_step2_title')}</Text>
          
          <View style={styles.optionsContainer}>
            {timeOptions.map(option => {
              const isSelected = selectedTime === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.card,
                    isSelected && { backgroundColor: 'white', transform: [{ scale: 1.02 }] }
                  ]}
                  onPress={() => handleSelect(option.id)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.cardEmoji}>{option.emoji}</Text>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, isSelected && { color: colors.primary }]}>{option.title}</Text>
                    <Text style={[styles.cardSubtitle, isSelected && { color: colors.textSecondary }]}>{option.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.progress}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={[styles.nextButtonText, { color: colors.primary }]}>{t('next_button')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: 24 },
  backButton: { marginTop: 12, marginBottom: 20 },
  middleSection: { flex: 1, justifyContent: 'center' },
  question: { fontSize: 22, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 32 },
  optionsContainer: { gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardEmoji: { fontSize: 32, marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  bottomSection: { alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: 'white' },
  dotActive: { backgroundColor: 'white' },
  nextButton: { backgroundColor: 'white', paddingVertical: 16, width: '100%', borderRadius: 12, alignItems: 'center' },
  nextButtonText: { fontSize: 16, fontWeight: 'bold' }
});
