import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { INDIA_THEMES } from '../../constants/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { useUserStore } from '../../stores/userStore';

const MODES = [
  { id: 'classic', label: 'Classic (25·5)' },
  { id: 'deepflow', label: 'Deep Flow (90·20)' },
  { id: 'quick', label: 'Quick (15·3)' },
  { id: 'student', label: 'Student (45·10)' },
  { id: 'custom', label: 'Custom' },
];

export default function FocusScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { selectedTimerMode, setSelectedTimerMode } = useUserStore();

  const handleThemePress = () => {
    Alert.alert("Coming soon", t('coming_stage2'));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_focus')} />
      <ScrollView contentContainerStyle={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesScroll}>
          {MODES.map(mode => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modePill,
                { 
                  backgroundColor: selectedTimerMode === mode.id ? colors.primary : 'transparent',
                  borderColor: selectedTimerMode === mode.id ? colors.primary : colors.border
                }
              ]}
              onPress={() => setSelectedTimerMode(mode.id)}
            >
              <Text style={[
                styles.modeText,
                { color: selectedTimerMode === mode.id ? 'white' : colors.textPrimary }
              ]}>{mode.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Your Environment</Text>
        
        <View style={styles.grid}>
          {INDIA_THEMES.map(theme => (
            <TouchableOpacity key={theme.id} style={styles.cardContainer} onPress={handleThemePress}>
              <LinearGradient
                colors={theme.gradientColors}
                style={styles.card}
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
              </LinearGradient>
            </TouchableOpacity>
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginTop: 10, marginBottom: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '50%',
    padding: 4,
  },
  card: {
    height: 140,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardEmoji: { fontSize: 24 },
  cardBadges: { flexDirection: 'row' },
  cardBottom: {},
  themeName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  themeNameHi: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  themeDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
});
