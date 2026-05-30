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
import { IS_EXPO_GO, firebaseAuth } from '../services/firebase';
import { useAuthStore } from '../stores/authStore';
import { syncService } from '../services/sync';

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

    // Firebase Auth Listener — only in real builds
    if (!IS_EXPO_GO && firebaseAuth) {
      const subscriber = firebaseAuth().onAuthStateChanged(async (user: any) => {
        setAuthUser(user);
        if (user) {
          await syncService.syncFromFirebase(user.uid);
        }
      });
      return subscriber; // unsubscribe on unmount
    }
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    SplashScreen.hideAsync();

    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inAuth = segments[0] === 'auth';

    setTimeout(() => {
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
    if (IS_EXPO_GO) return; // expo-notifications throws at module-level in Expo Go
    try {
      const Notifications = require('expo-notifications');
      const enabledStr = await AsyncStorage.getItem('sukoon_notifications_enabled');
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
    } catch (_) {}
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