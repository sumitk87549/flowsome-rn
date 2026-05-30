import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { NotoSansDevanagari_400Regular, NotoSansDevanagari_600SemiBold } from '@expo-google-fonts/noto-sans-devanagari';
import { useAppStore } from '../stores/appStore';
import { useUserStore } from '../stores/userStore';
import * as SplashScreen from 'expo-splash-screen';
import '../global.css';
import { View, Text, StyleSheet } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
  });

  const { loadFromStorage: loadAppSettings, colorScheme } = useAppStore();
  const { loadFromStorage: loadUserData, onboardingComplete } = useUserStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAppSettings();
    loadUserData();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    
    SplashScreen.hideAsync();

    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    // Wait a tick for router to be ready
    setTimeout(() => {
      if (!onboardingComplete && !inOnboarding) {
        router.replace('/onboarding/step1');
      } else if (onboardingComplete && !inTabsGroup) {
        router.replace('/(tabs)');
      }
    }, 100);
  }, [fontsLoaded, onboardingComplete]);

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