import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useSessionStore, AnySession } from '../stores/sessionStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { getAllSessions } = useSessionStore();
  const [filter, setFilter] = useState<'all' | 'focus' | 'breathe' | 'meditate'>('all');

  const allSessions = getAllSessions();
  const filtered = filter === 'all' ? allSessions : allSessions.filter(s => s.type === filter);

  // Group by date string
  const grouped = filtered.reduce((acc, session) => {
    const date = new Date(session.startTime).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, AnySession[]>);

  const sections = Object.keys(grouped).map(date => ({
    title: date,
    data: grouped[date]
  }));

  const renderItem = ({ item }: { item: AnySession }) => {
    let title = '';
    let color = '';
    let icon = '';
    let details = '';

    if (item.type === 'focus') { 
      title = `Focus: ${item.mode}`; 
      color = '#F4A44A'; 
      icon = 'timer';
      details = `${item.actualDuration}m completed • ${item.status}`;
    }
    if (item.type === 'breathe') { 
      title = `Breathing`; 
      color = '#2D8B6F'; 
      icon = 'leaf';
      details = `${item.completedRounds} rounds • ${Math.round(item.duration/60)}m`;
    }
    if (item.type === 'meditate') { 
      title = `Meditation`; 
      color = '#A855F7'; 
      icon = 'moon';
      details = `${item.duration}m • ${item.status}`;
    }

    return (
      <View style={[styles.itemContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
            {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {details}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader 
        title="Session History" 
        rightIcon={<Ionicons name="close" size={28} color={colors.textPrimary} />}
        onRightPress={() => router.back()}
      />

      {/* Filters */}
      <View style={styles.filterRow}>
        {['all', 'focus', 'breathe', 'meditate'].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[
              styles.filterPill, 
              { borderColor: colors.border },
              filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[
              styles.filterText, 
              { color: filter === f ? 'white' : colors.textSecondary }
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sessions found.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  }
});
