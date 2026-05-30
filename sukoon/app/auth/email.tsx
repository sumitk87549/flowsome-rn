import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { syncService } from '../../services/sync';
import { IS_EXPO_GO, firebaseAuth } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function EmailAuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }

    try {
      if (mode === 'signup') {
        if (!name) { setError('Name is required'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        await signUpWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }

      const user = !IS_EXPO_GO && firebaseAuth ? firebaseAuth().currentUser : null;
      if (user) {
        await syncService.syncLocalDataToFirebase(user.uid);
      }
      // _layout.tsx handles routing via onAuthStateChanged
    } catch (e: any) {
      setError(e.message || 'Authentication failed. Please try again.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Please enter your email to reset password'); return; }
    if (IS_EXPO_GO || !firebaseAuth) { setError('Password reset requires a development build.'); return; }
    try {
      await firebaseAuth().sendPasswordResetEmail(email);
      setResetSent(true);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</Text>
            <Text style={styles.subtitle}>
              {mode === 'signup'
                ? 'Sign up to sync your progress and access premium features.'
                : 'Sign in to continue your journey.'}
            </Text>
          </View>

          {IS_EXPO_GO && (
            <View style={styles.expoBanner}>
              <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
              <Text style={styles.expoBannerText}>Auth requires a development build. Your data is saved locally in Expo Go.</Text>
            </View>
          )}

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'signup' && styles.activeTab]}
              onPress={() => { setMode('signup'); setError(''); }}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'signin' && styles.activeTab]}
              onPress={() => { setMode('signin'); setError(''); }}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.activeTabText]}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} placeholder="Rahul Sharma" value={name} onChangeText={setName} autoCapitalize="words" />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={styles.passwordInput} placeholder="Min 8 characters" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {resetSent && <Text style={styles.successText}>Password reset email sent!</Text>}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : (
                <Text style={styles.submitBtnText}>{mode === 'signup' ? 'Create Account' : 'Sign In'}</Text>
              )}
            </TouchableOpacity>

            {mode === 'signin' && (
              <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAF8' },
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  backBtn: { marginBottom: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A18', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 24 },
  expoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 20,
  },
  expoBannerText: { flex: 1, color: '#92400E', fontSize: 12 },
  tabs: { flexDirection: 'row', marginBottom: 32, backgroundColor: '#EFEFEF', borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: 'white', elevation: 2 },
  tabText: { fontSize: 16, fontWeight: '500', color: '#666' },
  activeTabText: { color: '#1A1A18', fontWeight: 'bold' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  passwordContainer: { flexDirection: 'row', backgroundColor: 'white', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, alignItems: 'center' },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  eyeIcon: { padding: 12 },
  errorText: { color: '#E53935', fontSize: 14 },
  successText: { color: '#43A047', fontSize: 14 },
  submitBtn: { backgroundColor: '#F4A44A', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { color: '#F4A44A', fontWeight: '600', fontSize: 14 },
});
