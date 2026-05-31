import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

const TIMER_MODES = [
  { id: 'classic', label: 'Classic', emoji: '🍅', work: 25, break: 5, cycles: 4, desc: '25/5 · 4 cycles' },
  { id: 'deepflow', label: 'Deep Flow', emoji: '🧠', work: 90, break: 20, cycles: 2, desc: '90/20 · 2 cycles' },
  { id: 'quick', label: 'Quick', emoji: '⚡', work: 15, break: 3, cycles: 4, desc: '15/3 · 4 cycles' },
];

const MORE_MODES = [
  { id: 'student', label: 'Student', emoji: '📚', work: 45, break: 10, cycles: 4, desc: '45/10 · 4 cycles' },
  { id: 'custom', label: 'Custom', emoji: '⚙️', work: 25, break: 5, cycles: 4, desc: 'Set your own' },
];

export default function FocusScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { hasAccess } = usePremiumGate();

  const [selectedModeId, setSelectedModeId] = useState('classic');
  const [selectedThemeId, setSelectedThemeId] = useState(INDIA_THEMES[0].id);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [showMoreModes, setShowMoreModes] = useState(false);
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);

  const allModes = [...TIMER_MODES, ...MORE_MODES];
  const selectedMode = allModes.find(m => m.id === selectedModeId) || TIMER_MODES[0];
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
      <ScreenHeader title={t('nav_focus')} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Timer Modes - Large Cards */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Timer Mode</Text>
        <View style={styles.modesGrid}>
          {TIMER_MODES.map(mode => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeCard,
                {
                  backgroundColor: selectedModeId === mode.id ? colors.primarySoft : colors.surface,
                  borderColor: selectedModeId === mode.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedModeId(mode.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.modeEmoji}>{mode.emoji}</Text>
              <Text style={[styles.modeLabel, { color: selectedModeId === mode.id ? colors.primary : colors.textPrimary }]}>
                {mode.label}
              </Text>
              <Text style={[styles.modeDesc, { color: colors.textTertiary }]}>{mode.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* More modes toggle */}
        <TouchableOpacity
          style={styles.moreModes}
          onPress={() => setShowMoreModes(!showMoreModes)}
        >
          <Text style={[styles.moreModesText, { color: colors.textTertiary }]}>
            {showMoreModes ? 'Less options' : 'More options'}
          </Text>
          <Ionicons name={showMoreModes ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {showMoreModes && (
          <View style={styles.moreModesGrid}>
            {MORE_MODES.map(mode => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeCardSmall,
                  {
                    backgroundColor: selectedModeId === mode.id ? colors.primarySoft : colors.surface,
                    borderColor: selectedModeId === mode.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setSelectedModeId(mode.id)}
              >
                <Text style={styles.modeEmojiSmall}>{mode.emoji}</Text>
                <Text style={[styles.modeLabelSmall, { color: selectedModeId === mode.id ? colors.primary : colors.textPrimary }]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Custom Controls */}
        {selectedModeId === 'custom' && (
          <View style={[styles.customPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.customRow}>
              <Text style={[styles.customLabel, { color: colors.textSecondary }]}>Work</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => setCustomWork(Math.max(5, customWork - 5))}
                  style={[styles.stepperBtn, { backgroundColor: colors.glassSurface }]}
                >
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.customValue, { color: colors.primary }]}>{customWork} min</Text>
                <TouchableOpacity
                  onPress={() => setCustomWork(Math.min(120, customWork + 5))}
                  style={[styles.stepperBtn, { backgroundColor: colors.glassSurface }]}
                >
                  <Ionicons name="add" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.customRow}>
              <Text style={[styles.customLabel, { color: colors.textSecondary }]}>Break</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => setCustomBreak(Math.max(1, customBreak - 1))}
                  style={[styles.stepperBtn, { backgroundColor: colors.glassSurface }]}
                >
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.customValue, { color: colors.accent }]}>{customBreak} min</Text>
                <TouchableOpacity
                  onPress={() => setCustomBreak(Math.min(30, customBreak + 1))}
                  style={[styles.stepperBtn, { backgroundColor: colors.glassSurface }]}
                >
                  <Ionicons name="add" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Environments */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 8 }]}>Environment</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themesScroll}>
          {INDIA_THEMES.map(theme => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <TouchableOpacity key={theme.id} style={styles.themeCard} onPress={() => handleThemePress(theme)} activeOpacity={0.85}>
                <LinearGradient
                  colors={theme.gradientColors as [string, string]}
                  style={[styles.themeGradient, isSelected && { borderColor: 'white', borderWidth: 2 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                  <View>
                    <Text style={styles.themeName}>{theme.name}</Text>
                    {!theme.free && !hasAccess && (
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.lockText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  {isSelected && (
                    <View style={styles.selectedCheck}>
                      <Ionicons name="checkmark" size={14} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.bottomAction, { backgroundColor: colors.background }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleStartSession}>
          <LinearGradient
            colors={colors.gradientPrimary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButton}
          >
            <Ionicons name="play" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.startButtonText}>Start Focus</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.modeDetailsText, { color: colors.textTertiary }]}>
          {activeWork} min work · {activeBreak} min break · {selectedMode.cycles} cycles
        </Text>
      </View>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  // Mode Cards
  modesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  modeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  modeEmoji: { fontSize: 24, marginBottom: 6 },
  modeLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  modeDesc: { fontSize: 10, fontWeight: '500' },
  // More modes
  moreModes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  moreModesText: { fontSize: 12, fontWeight: '600' },
  moreModesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  modeCardSmall: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeEmojiSmall: { fontSize: 18 },
  modeLabelSmall: { fontSize: 13, fontWeight: '600' },
  // Custom panel
  customPanel: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  customRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customLabel: { fontSize: 14, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customValue: { fontSize: 16, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  // Themes
  themesScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  themeCard: { width: 150 },
  themeGradient: {
    height: 100,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  themeEmoji: { fontSize: 20 },
  themeName: { color: 'white', fontWeight: '700', fontSize: 13 },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  lockText: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D8B6F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonText: { color: 'white', fontSize: 17, fontWeight: '700' },
  modeDetailsText: { fontSize: 12, fontWeight: '500', marginTop: 8 },
});
