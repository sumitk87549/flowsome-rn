import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from '../../hooks/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeAuthScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signInWithGoogle, continueAsGuest, isLoading } = useAuthStore();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // On success, _layout.tsx will auto-redirect because auth state changes
    } catch (e) {
      // Error handled in store, maybe show a toast in real app
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    // _layout.tsx will redirect since isGuest becomes true
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0B2E', '#E67E22', '#D35400']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>सुकून</Text>
            <Text style={styles.logoSub}>Sukoon</Text>
          </View>

          <View style={styles.authContainer}>
            <Text style={styles.title}>Your journey to calm begins here</Text>
            
            <TouchableOpacity 
              style={[styles.btn, styles.googleBtn]} 
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>या / or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              style={[styles.btn, styles.emailBtn]} 
              onPress={() => router.push('/auth/email')}
              disabled={isLoading}
            >
              <Ionicons name="mail" size={24} color="white" />
              <Text style={styles.emailBtnText}>Continue with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
              <Text style={styles.guestText}>Use without account</Text>
            </TouchableOpacity>
            
            <Text style={styles.finePrint}>
              Your data is encrypted and private. Cancel anytime.
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoText: {
    fontSize: 64,
    color: '#FFF',
    fontWeight: 'bold',
  },
  logoSub: {
    fontSize: 24,
    color: '#FFF',
    letterSpacing: 4,
  },
  authContainer: {
    width: '100%',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  googleBtn: {
    backgroundColor: '#FFF',
  },
  googleBtnText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emailBtn: {
    backgroundColor: '#F4A44A',
  },
  emailBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  orText: {
    color: 'rgba(255,255,255,0.8)',
    marginHorizontal: 16,
    fontSize: 14,
  },
  guestBtn: {
    marginTop: 8,
    padding: 12,
  },
  guestText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  finePrint: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
  },
});
