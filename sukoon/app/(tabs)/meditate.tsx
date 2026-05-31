import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MEDITATIONS } from '../../constants/meditations';
import { PaywallModal } from '../../components/PaywallModal';
import { usePremiumGate } from '../../hooks/usePremiumGate';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'sleep', label: 'Sleep', emoji: '🌙' },
  { id: 'focus', label: 'Focus', emoji: '🎯' },
  { id: 'stress', label: 'Stress', emoji: '🧘' },
  { id: 'morning', label: 'Morning', emoji: '🌅' },
];

export default function MeditateScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { hasAccess } = usePremiumGate();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('meditation_language').then(lang => {
      if (lang === 'hi' || lang === 'en') setLanguage(lang);
    });
  }, []);

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    await AsyncStorage.setItem('meditation_language', newLang);
  };

  const handlePress = (meditationId: string, isFree: boolean) => {
    if (!isFree && !hasAccess) {
      setPaywallVisible(true);
      return;
    }
    router.push({
      pathname: '/session/meditate',
      params: { id: meditationId, lang: language }
    });
  };

  // Featured session based on time
  const getFeaturedSession = () => {
    const hour = new Date().getHours();
    let id = '';
    if (hour >= 5 && hour < 11) id = 'morning-gratitude';
    else if (hour >= 11 && hour < 17) id = 'single-point';
    else if (hour >= 17 && hour < 21) id = 'stress-debrief';
    else id = 'body-scan';
    return MEDITATIONS.find(m => m.id === id) || MEDITATIONS[0];
  };

  const featured = getFeaturedSession();

  // Filter
  const filteredMeditations = MEDITATIONS.filter(m => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    return true;
  });

  const getCategoryGradient = (catId: string): [string, string] => {
    switch (catId) {
      case 'sleep': return ['#2A1A4A', '#1A0B2E'];
      case 'focus': return ['#1A3A4A', '#0B222E'];
      case 'stress': return ['#3A2020', '#2E1515'];
      case 'morning': return ['#3A2B10', '#2E1E08'];
      default: return ['#1A2530', '#0E1520'];
    }
  };

  const LanguageToggle = () => (
    <TouchableOpacity onPress={toggleLanguage}>
      <View style={[styles.langToggle, { borderColor: colors.border }]}>
        <Text style={[styles.langText, { color: language === 'hi' ? colors.primary : colors.textTertiary, fontWeight: language === 'hi' ? '700' : '400' }]}>हिं</Text>
        <View style={[styles.langDivider, { backgroundColor: colors.border }]} />
        <Text style={[styles.langText, { color: language === 'en' ? colors.primary : colors.textTertiary, fontWeight: language === 'en' ? '700' : '400' }]}>EN</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_meditate')} rightIcon={<LanguageToggle />} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Featured Card */}
        <TouchableOpacity style={styles.featuredContainer} onPress={() => handlePress(featured.id, featured.free)} activeOpacity={0.9}>
          <LinearGradient
            colors={['#2D8B6F', '#1A5C49']}
            style={styles.featuredCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>✦ DAILY PICK</Text>
            </View>
            <View style={styles.featuredContent}>
              <View style={styles.featuredTextArea}>
                <Text style={styles.featuredTitle}>{language === 'en' ? featured.title : featured.titleHi}</Text>
                <Text style={styles.featuredMeta}>{featured.duration} min · {featured.category} · {featured.level}</Text>
              </View>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={22} color="#2D8B6F" style={{ marginLeft: 2 }} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Category Filter (single row, merged) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterPill,
                {
                  backgroundColor: selectedCategory === cat.id ? colors.primarySoft : 'transparent',
                  borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.filterText,
                { color: selectedCategory === cat.id ? colors.primary : colors.textPrimary }
              ]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meditation Grid */}
        <View style={styles.grid}>
          {filteredMeditations.map(item => (
            <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => handlePress(item.id, item.free)} activeOpacity={0.85}>
              <LinearGradient
                colors={getCategoryGradient(item.category)}
                style={styles.medCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.medTop}>
                  <View style={[styles.durationBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={styles.durationText}>{item.duration}m</Text>
                  </View>
                  {!item.free && !hasAccess ? (
                    <View style={styles.lockIcon}>
                      <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.5)" />
                    </View>
                  ) : item.free ? (
                    <View style={[styles.freeBadge, { backgroundColor: 'rgba(244,164,74,0.2)' }]}>
                      <Text style={styles.freeText}>FREE</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.medBottom}>
                  <Text style={styles.medTitle} numberOfLines={2}>
                    {language === 'en' ? item.title : item.titleHi}
                  </Text>
                  <View style={styles.medMeta}>
                    <View style={[styles.levelDot, { backgroundColor: item.level === 'beginner' ? '#A5D6A7' : '#FFCC80' }]} />
                    <Text style={styles.medLevel}>{item.level}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {filteredMeditations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🧘</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sessions match this filter.</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 20 },

  // Language toggle
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langText: { fontSize: 11 },
  langDivider: { width: 1, height: 10, marginHorizontal: 5 },

  // Featured
  featuredContainer: { paddingHorizontal: 20, paddingBottom: 16 },
  featuredCard: {
    borderRadius: 22,
    padding: 20,
    minHeight: 130,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  featuredBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  featuredContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTextArea: { flex: 1, paddingRight: 16 },
  featuredTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  featuredMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
  playCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  // Filters (single row)
  filtersScroll: { flexGrow: 0, marginBottom: 16 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 5,
  },
  filterEmoji: { fontSize: 14 },
  filterText: { fontWeight: '600', fontSize: 13 },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
  },
  gridItem: {
    width: '50%',
    padding: 6,
  },
  medCard: {
    height: 155,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
  },
  medTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  durationText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
  lockIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  freeText: { color: '#F4A44A', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  medBottom: {},
  medTitle: { color: 'white', fontWeight: '700', fontSize: 15, marginBottom: 4, lineHeight: 20 },
  medMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  medLevel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { textAlign: 'center', fontSize: 14 },
});
