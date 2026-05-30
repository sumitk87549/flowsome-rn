import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MEDITATIONS } from '../../constants/meditations';
import { PaywallModal } from '../../components/PaywallModal';
import { usePremiumGate } from '../../hooks/usePremiumGate';

const DURATIONS = ['All', '5 min', '10 min', '15 min', '20+ min'];
const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '⭐' },
  { id: 'sleep', label: 'Sleep', emoji: '🌙' },
  { id: 'focus', label: 'Focus', emoji: '🎯' },
  { id: 'stress', label: 'Stress Relief', emoji: '🔥' },
  { id: 'morning', label: 'Morning', emoji: '🌅' },
];

export default function MeditateScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  
  const { hasAccess } = usePremiumGate();
  
  const [selectedDuration, setSelectedDuration] = useState('All');
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

  // Get featured session based on time of day
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

  // Filter meditations
  const filteredMeditations = MEDITATIONS.filter(m => {
    // Category match
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    
    // Duration match
    if (selectedDuration !== 'All') {
      if (selectedDuration === '5 min' && m.duration > 5) return false;
      if (selectedDuration === '10 min' && (m.duration <= 5 || m.duration > 10)) return false;
      if (selectedDuration === '15 min' && (m.duration <= 10 || m.duration > 15)) return false;
      if (selectedDuration === '20+ min' && m.duration <= 15) return false;
    }
    return true;
  });

  const getCategoryColors = (catId: string) => {
    switch (catId) {
      case 'sleep': return ['#2A1A4A', '#1A0B2E'];
      case 'focus': return ['#1A3A4A', '#0B222E'];
      case 'stress': return ['#4A2A2A', '#2E0B0B'];
      case 'morning': return ['#4A3B1A', '#2E220B'];
      default: return ['#2A3A4A', '#1A222E'];
    }
  };

  const LanguageToggle = () => (
    <TouchableOpacity onPress={toggleLanguage} style={[styles.langToggle, { borderColor: colors.border }]}>
      <Text style={[styles.langText, { color: language === 'hi' ? colors.primary : colors.textTertiary, fontWeight: language === 'hi' ? 'bold' : 'normal' }]}>हिं</Text>
      <View style={[styles.langDivider, { backgroundColor: colors.border }]} />
      <Text style={[styles.langText, { color: language === 'en' ? colors.primary : colors.textTertiary, fontWeight: language === 'en' ? 'bold' : 'normal' }]}>EN</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('nav_meditate')} rightIcon={<LanguageToggle />} />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Featured Card */}
        <TouchableOpacity style={styles.featuredContainer} onPress={() => handlePress(featured.id, featured.free)}>
          <LinearGradient
            colors={['#2D8B6F', '#1C604B']}
            style={styles.featuredCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.featuredContent}>
              <View>
                <Badge label="Daily Pick" color="white" style={{ alignSelf: 'flex-start', marginBottom: 8 }} />
                <Text style={styles.featuredTitle}>{language === 'en' ? featured.title : featured.titleHi}</Text>
                <Text style={styles.featuredDuration}>{featured.duration} min • {featured.category}</Text>
              </View>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={24} color="#2D8B6F" style={{ marginLeft: 3 }} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Duration Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {DURATIONS.map(dur => (
            <TouchableOpacity
              key={dur}
              style={[
                styles.pill,
                { 
                  backgroundColor: selectedDuration === dur ? colors.primary : 'transparent',
                  borderColor: selectedDuration === dur ? colors.primary : colors.border
                }
              ]}
              onPress={() => setSelectedDuration(dur)}
            >
              <Text style={[
                styles.pillText,
                { color: selectedDuration === dur ? 'white' : colors.textPrimary }
              ]}>{dur}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)}>
              <Card style={[styles.catCard, { borderColor: selectedCategory === cat.id ? colors.primary : colors.border }]}>
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={[styles.catLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meditation Grid */}
        <View style={styles.grid}>
          {filteredMeditations.map(item => (
            <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => handlePress(item.id, item.free)}>
              <LinearGradient
                colors={getCategoryColors(item.category) as [string, string]}
                style={styles.medCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.medTop}>
                  <Badge label={`${item.duration}m`} color="rgba(255,255,255,0.2)" />
                  {!item.free && <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.7)" />}
                  {item.free && <Badge label="FREE" color="#F4A44A" />}
                </View>
                
                <View style={styles.medBottom}>
                  <Text style={styles.medTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.medTitleHi} numberOfLines={1}>{item.titleHi}</Text>
                  <View style={styles.medMetaRow}>
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
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🧘</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No sessions found for this combination.</Text>
          </View>
        )}

      </ScrollView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 40 },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langText: { fontSize: 12 },
  langDivider: { width: 1, height: 12, marginHorizontal: 6 },
  
  featuredContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  featuredCard: {
    height: 140,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
  },
  featuredContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  featuredDuration: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  horizontalScroll: { paddingHorizontal: 20, paddingVertical: 8, flexGrow: 0 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  pillText: { fontWeight: '600' },
  catCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
  },
  catEmoji: { fontSize: 18 },
  catLabel: { fontWeight: '600' },
  
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginTop: 8,
  },
  gridItem: {
    width: '50%',
    padding: 6,
  },
  medCard: {
    height: 160,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  medTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medBottom: {},
  medTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  medTitleHi: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  medMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  medLevel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { textAlign: 'center' }
});
