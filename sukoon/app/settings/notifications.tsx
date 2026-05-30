import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// expo-notifications throws a module-level error in Expo Go SDK 53+, not catchable by try/catch
// Must guard with executionEnvironment check first
const isExpoGo = Constants.executionEnvironment === 'storeClient';
let Notifications: any = null;
if (!isExpoGo) {
  try { Notifications = require('expo-notifications'); } catch (_) {}
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('08:00'); // simple string for now

  useEffect(() => {
    const loadSettings = async () => {
      const storedEnabled = await AsyncStorage.getItem('sukoon_notifications_enabled');
      const storedTime = await AsyncStorage.getItem('sukoon_notifications_time');
      
      if (storedEnabled === 'true') setEnabled(true);
      if (storedTime) setTime(storedTime);
    };
    loadSettings();
  }, []);

  const handleToggle = async (val: boolean) => {
    setEnabled(val);
    await AsyncStorage.setItem('sukoon_notifications_enabled', String(val));
    
    if (val) {
      scheduleNotification();
    } else {
      cancelNotifications();
    }
  };

  const scheduleNotification = async () => {
    if (!Notifications) return;
    
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          setEnabled(false);
          await AsyncStorage.setItem('sukoon_notifications_enabled', 'false');
          Alert.alert('Permission Denied', 'Please enable notifications in your phone settings.');
          return;
        }
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const [hourStr, minuteStr] = time.split(':');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for Sukoon 🌱",
          body: "Take a moment to pause and breathe today.",
        },
        trigger: {
          hour: parseInt(hourStr),
          minute: parseInt(minuteStr),
          repeats: true,
        },
      });
      
    } catch (e) {
      console.warn("Failed to schedule notification", e);
    }
  };

  const cancelNotifications = async () => {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn("Failed to cancel notifications", e);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    setTime(newTime);
    await AsyncStorage.setItem('sukoon_notifications_time', newTime);
    if (enabled) {
      scheduleNotification();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader 
        title="Notifications" 
        rightIcon={<Ionicons name="close" size={28} color={colors.textPrimary} />}
        onRightPress={() => router.back()}
      />
      
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Daily Reminder</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Get a gentle nudge to meditate</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>

          {enabled && (
            <View style={[styles.timeRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Time</Text>
              
              {/* Very simple time picker for demonstration. A real app might use @react-native-community/datetimepicker */}
              <View style={styles.timeOptions}>
                {['07:00', '08:00', '09:00', '20:00', '21:00'].map(t => (
                  <TouchableOpacity 
                    key={t}
                    style={[styles.timePill, { borderColor: time === t ? colors.primary : colors.border, backgroundColor: time === t ? colors.primary : 'transparent' }]}
                    onPress={() => handleTimeChange(t)}
                  >
                    <Text style={{ color: time === t ? 'white' : colors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {!Notifications && (
          <Text style={[styles.devNote, { color: colors.textTertiary }]}>
            Note: Push notifications are disabled in Expo Go. They will work in production builds.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  subLabel: { fontSize: 12 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    width: 200,
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  devNote: {
    marginTop: 20,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});
