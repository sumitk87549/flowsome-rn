import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { INDIA_THEMES } from '../../constants/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { useRouter } from 'expo-router';
import { PaywallModal } from '../../components/PaywallModal';
import { usePremiumGate } from '../../hooks/usePremiumGate';

export const TIMER_MODES = [
  { id: 'classic', label: 'Classic', emoji: '🍅', work: 25, break: 5, longBreak: 30, cycles: 4 },
  { id: 'deepflow', label: 'Deep Flow', emoji: '🧠', work: 90, break: 20, longBreak: 30, cycles: 2 },
  { id: 'quick', label: 'Quick Burst', emoji: '⚡', work: 15, break: 3, longBreak: 15, cycles: 4 },
  { id: 'student', label: 'Student', emoji: '📚', work: 45, break: 10, longBreak: 30, cycles: 4 },
  { id: 'custom', label: 'Custom', emoji: '⚙️', work: 25, break: 5, longBreak: 15, cycles: 4 },
];

export default function FocusScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  
  const { hasAccess } = usePremiumGate();
  
  const [selectedModeId, setSelectedModeId] = useState('classic');
  const [selectedThemeId, setSelectedThemeId] = useState(INDIA_THEMES[0].id);
  const [paywallVisible, setPaywallVisible] = useState(false);
  
  // Custom mode state
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);

  const selectedMode = TIMER_MODES.find(m => m.id === selectedModeId) || TIMER_MODES[0];
  const activeWork = selectedModeId === 'custom' ? customWork : selectedMode.work;
  const activeBreak = selectedModeId === 'custom' ? customBreak : selectedMode.break;

  const handleThemePress = (theme: typeof INDIA_THEMES[0]) => {
    if (!theme.free && !hasAccess) {
      setPaywallVisible(true);
      return;
    }
    setSelectedThemeId(theme.id);
  };

  const handleStartSession = () => {
    router.push({
      pathname: '/session/focus',
      params: {
        modeId: selectedModeId,
        themeId: selectedThemeId,
        work: activeWork,
        break: activeBreak,
        cycles: selectedMode.cycles
      }
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_focus')} rightIcon={<Ionicons name="settings-outline" size={24} color={colors.textPrimary} />} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Modes */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesScroll}>
          {TIMER_MODES.map(mode => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modePill,
                { 
                  backgroundColor: selectedModeId === mode.id ? colors.primary : 'transparent',
                  borderColor: selectedModeId === mode.id ? colors.primary : colors.border
                }
              ]}
              onPress={() => setSelectedModeId(mode.id)}
            >
              <Text style={[styles.modeEmoji]}>{mode.emoji}</Text>
              <Text style={[
                styles.modeText,
                { color: selectedModeId === mode.id ? 'white' : colors.textPrimary }
              ]}>{mode.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Custom Panel */}
        {selectedModeId === 'custom' && (
          <View style={[styles.customPanel, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.customTitle, { color: colors.textPrimary }]}>Custom Timer</Text>
            
            <View style={styles.sliderRow}>
              <Text style={{ color: colors.textSecondary }}>Work</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{customWork} min</Text>
            </View>
            {/* Simple placeholder for sliders - real sliders require @react-native-community/slider which we don't have installed yet */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity onPress={() => setCustomWork(Math.max(5, customWork - 5))} style={[styles.stepperBtn, { backgroundColor: colors.surface }]}><Text style={{color: colors.textPrimary}}>-</Text></TouchableOpacity>
              <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}><View style={[styles.sliderFill, { width: `${(customWork / 120) * 100}%`, backgroundColor: colors.primary }]} /></View>
              <TouchableOpacity onPress={() => setCustomWork(Math.min(120, customWork + 5))} style={[styles.stepperBtn, { backgroundColor: colors.surface }]}><Text style={{color: colors.textPrimary}}>+</Text></TouchableOpacity>
            </View>

            <View style={styles.sliderRow}>
              <Text style={{ color: colors.textSecondary }}>Break</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{customBreak} min</Text>
            </View>
            <View style={styles.stepperContainer}>
              <TouchableOpacity onPress={() => setCustomBreak(Math.max(1, customBreak - 1))} style={[styles.stepperBtn, { backgroundColor: colors.surface }]}><Text style={{color: colors.textPrimary}}>-</Text></TouchableOpacity>
              <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}><View style={[styles.sliderFill, { width: `${(customBreak / 30) * 100}%`, backgroundColor: colors.accent }]} /></View>
              <TouchableOpacity onPress={() => setCustomBreak(Math.min(30, customBreak + 1))} style={[styles.stepperBtn, { backgroundColor: colors.surface }]}><Text style={{color: colors.textPrimary}}>+</Text></TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Your Environment</Text>
        
        <View style={styles.grid}>
          {INDIA_THEMES.map(theme => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <TouchableOpacity key={theme.id} style={styles.cardContainer} onPress={() => handleThemePress(theme)}>
                <LinearGradient
                  colors={theme.gradientColors}
                  style={[styles.card, isSelected && styles.cardSelected, isSelected && { borderColor: 'white', borderWidth: 2 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardEmoji}>{theme.emoji}</Text>
                    <View style={styles.cardBadges}>
                      {theme.free ? (
                        <Badge label={t('theme_free')} color={colors.primary} />
                      ) : (
                        <Badge label={t('theme_premium')} color={colors.accent} icon={<Ionicons name="lock-closed" size={10} color={colors.accent} />} />
                      )}
                    </View>
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.themeName}>{theme.name}</Text>
                    <Text style={styles.themeNameHi}>{theme.nameHi}</Text>
                    <Text style={styles.themeDesc} numberOfLines={2}>{theme.description}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spacer for bottom fixed button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={[styles.bottomAction, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]} onPress={handleStartSession}>
          <Text style={styles.startButtonText}>Start Session</Text>
        </TouchableOpacity>
        <Text style={[styles.modeDetailsText, { color: colors.textSecondary }]}>
          {activeWork} min work · {activeBreak} min break
        </Text>
        <Text style={[styles.noticeText, { color: colors.textTertiary }]}>Session saved automatically — even if app closes</Text>
      </View>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 40 },
  modesScroll: { paddingHorizontal: 20, paddingVertical: 16, flexGrow: 0 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 12,
  },
  modeEmoji: { marginRight: 6, fontSize: 16 },
  modeText: { fontWeight: '600' },
  customPanel: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  customTitle: { fontWeight: 'bold', marginBottom: 12 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sliderTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  sliderFill: { height: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginTop: 10, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  cardContainer: { width: '50%', padding: 4 },
  card: { height: 140, borderRadius: 16, padding: 12, justifyContent: 'space-between', overflow: 'hidden' },
  cardSelected: { transform: [{ scale: 0.98 }] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardEmoji: { fontSize: 24 },
  cardBadges: { flexDirection: 'row' },
  cardBottom: {},
  themeName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  themeNameHi: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  themeDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  checkBadge: { position: 'absolute', top: 10, right: 10, opacity: 0.9 },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  startButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modeDetailsText: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  noticeText: { fontSize: 12, fontStyle: 'italic' },
});
