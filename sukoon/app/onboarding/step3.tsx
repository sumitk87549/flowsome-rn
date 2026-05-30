import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../stores/appStore';

export default function Step3Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { setOnboardingComplete, timePreference } = useUserStore();
  const { saveToStorage } = useAppStore();

  const handleStart = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    await AsyncStorage.setItem('language', 'en');
    setOnboardingComplete(true);
    saveToStorage();
    router.replace('/(tabs)');
  };

  const getEveningTime = () => {
    if (timePreference === '5-10 Minutes') return '5 min';
    if (timePreference === '30+ Minutes') return '20 min';
    return '10 min';
  };

  return (
    <LinearGradient colors={['#FF8C42', '#1A3A5C']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={48} color="#4DB896" />
            <Text style={styles.title}>{t('onb_step3_title')}</Text>
          </View>

          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <Text style={styles.planEmoji}>🌬️</Text>
              <Text style={styles.planText}>{t('onb_plan_morning')}</Text>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}30` }]}>
                <Text style={styles.badgeText}>5 min</Text>
              </View>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.planRow}>
              <Text style={styles.planEmoji}>🎯</Text>
              <Text style={styles.planText}>{t('onb_plan_focus')}</Text>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}30` }]}>
                <Text style={styles.badgeText}>25 min</Text>
              </View>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.planRow}>
              <Text style={styles.planEmoji}>🧘</Text>
              <Text style={styles.planText}>{t('onb_plan_evening')}</Text>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}30` }]}>
                <Text style={styles.badgeText}>{getEveningTime()}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.note}>{t('customize_note')}</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={[styles.startButtonText, { color: colors.primary }]}>{t('onb_start_button')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 16 },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  planEmoji: { fontSize: 24, marginRight: 16 },
  planText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#1A5C49' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  note: { textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  bottomSection: { marginBottom: 20 },
  startButton: { backgroundColor: 'white', paddingVertical: 18, width: '100%', borderRadius: 12, alignItems: 'center' },
  startButtonText: { fontSize: 18, fontWeight: 'bold' }
});
