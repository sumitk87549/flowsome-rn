import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { NotoSansDevanagari_400Regular, NotoSansDevanagari_600SemiBold } from '@expo-google-fonts/noto-sans-devanagari';
import { useAppStore } from '../stores/appStore';
import { useUserStore } from '../stores/userStore';
import * as SplashScreen from 'expo-splash-screen';
import '../global.css';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import auth from '@react-native-firebase/auth';
import { useAuthStore } from '../stores/authStore';
import { syncService } from '../services/sync';

// expo-notifications throws a module-level (uncatchable) error in Expo Go SDK 53+
// So we must guard with an environment check BEFORE requiring it
const isExpoGo = Constants.executionEnvironment === 'storeClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
  });

  const { loadFromStorage: loadAppSettings, colorScheme } = useAppStore();
  const { loadFromStorage: loadUserData, onboardingComplete } = useUserStore();
  const { setAuthUser, isAuthenticated, isGuest } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAppSettings();
    loadUserData();
    
    // Auth Listener
    const subscriber = auth().onAuthStateChanged(async (user) => {
      setAuthUser(user);
      if (user) {
        // Run cloud sync when user is detected
        await syncService.syncFromFirebase(user.uid);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    
    SplashScreen.hideAsync();

    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inAuth = segments[0] === 'auth';

    // Wait a tick for router to be ready
    setTimeout(() => {
      // Logic:
      // 1. If not authenticated and not guest -> Auth Welcome
      // 2. If authenticated or guest, but onboarding not complete -> Onboarding
      // 3. If authenticated or guest, and onboarding complete -> Tabs
      
      const hasAccess = isAuthenticated || isGuest;

      if (!hasAccess && !inAuth) {
        router.replace('/auth/welcome');
      } else if (hasAccess && !onboardingComplete && !inOnboarding) {
        router.replace('/onboarding/step1');
      } else if (hasAccess && onboardingComplete && !inTabsGroup) {
        setupNotifications();
        router.replace('/(tabs)');
      }
    }, 100);
  }, [fontsLoaded, onboardingComplete, isAuthenticated, isGuest]);

  const setupNotifications = async () => {
    // Never touch expo-notifications in Expo Go — it throws at module level
    if (isExpoGo) return;
    try {
      const Notifications = require('expo-notifications');
      const enabledStr = await AsyncStorage.getItem('sukoon_notifications_enabled');
      
      // If we haven't asked yet, or they have it enabled
      if (enabledStr === null) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await AsyncStorage.setItem('sukoon_notifications_enabled', 'true');
          await AsyncStorage.setItem('sukoon_notifications_time', '08:00');
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Time for Sukoon 🌱",
              body: "Take a moment to pause and breathe today.",
            },
            trigger: { hour: 8, minute: 0, repeats: true },
          });
        } else {
          await AsyncStorage.setItem('sukoon_notifications_enabled', 'false');
        }
      }
    } catch (e) {
      // ignore
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.splash, { backgroundColor: colorScheme === 'dark' ? '#0E0E0C' : '#FAFAF8' }]}>
        <Text style={{ fontSize: 48, color: colorScheme === 'dark' ? '#F0EDE8' : '#1A1A18' }}>सुकून</Text>
        <Text style={{ fontSize: 22, color: colorScheme === 'dark' ? '#F0EDE8' : '#1A1A18' }}>Sukoon</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});