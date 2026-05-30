import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'expo-router';
import { PaywallModal } from '../components/PaywallModal';
import { syncService } from '../services/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  
  const { user, isGuest, subscription, signOut } = useAuthStore();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const referralCode = user ? `SUKOON${user.uid.substring(0, 4).toUpperCase()}` : '';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Dosto, try karo Sukoon app — India ka best meditation app! 🧘\nDownload: https://sukoon.app | My code: ${referralCode} (use kar lo, free 1 month milega)`
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        await signOut();
      }}
    ]);
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your local sessions and streak data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          await AsyncStorage.clear();
          alert("All local data deleted.");
          if (!user) router.replace('/auth/welcome');
        }}
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      `Are you sure? You'll lose access on ${new Date(subscription?.expiresAt || Date.now()).toLocaleDateString()}`,
      [
        { text: "No, keep it", style: "cancel" },
        { text: "Yes, cancel", style: "destructive", onPress: () => {
           Alert.alert("We're sorry to see you go", "Your subscription has been cancelled. You have access until the end of your billing cycle. Come back anytime 🙏");
           // In reality, you'd call a Cloud Function to cancel in Razorpay here
           useAuthStore.getState().setSubscription({
             plan: subscription?.plan || 'free',
             status: 'cancelled',
             expiresAt: subscription?.expiresAt || null,
             isActive: true // Still active until expiresAt
           });
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader 
        title="Settings" 
        rightIcon={<Ionicons name="close" size={28} color={colors.textPrimary} />}
        onRightPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {isGuest ? (
              <View style={styles.row}>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Guest Mode</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Your data is only saved locally.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/auth/welcome')}>
                  <Text style={styles.actionBtnText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                        {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{user?.displayName || 'User'}</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{user?.email}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.row}>
                  <View>
                    <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                      Plan: {subscription?.isActive ? subscription.plan.toUpperCase() : 'FREE'}
                    </Text>
                    {subscription?.isActive && subscription.expiresAt && (
                      <Text style={[styles.rowSub, { color: colors.accent }]}>
                        {subscription.status === 'cancelled' ? 'Ends' : 'Renews'}: {new Date(subscription.expiresAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => subscription?.isActive ? handleCancelSubscription() : setPaywallVisible(true)}
                  >
                    <Text style={styles.actionBtnText}>
                      {subscription?.isActive ? 'Cancel' : 'Upgrade'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={() => router.push('/settings/notifications')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            
            {/* Real app would have a language/theme picker here */}
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="language-outline" size={20} color={colors.textPrimary} />
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Language (Change in tabs)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Share & Earn */}
        {!isGuest && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Share & Earn</Text>
            <TouchableOpacity style={[styles.card, { backgroundColor: '#F4A44A15', borderColor: '#F4A44A' }]} onPress={handleShare}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: '#F4A44A' }]}>Get 1 Free Month</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Share your code <Text style={{fontWeight:'bold', color:colors.textPrimary}}>{referralCode}</Text> with friends.
                  </Text>
                </View>
                <Ionicons name="share-social" size={24} color="#F4A44A" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data & Privacy</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={handleDeleteData}>
              <Text style={[styles.rowTitle, { color: '#E53935' }]}>Delete Local Data</Text>
            </TouchableOpacity>
            {!isGuest && (
              <TouchableOpacity style={styles.row} onPress={handleSignOut}>
                <Text style={[styles.rowTitle, { color: '#E53935' }]}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[styles.versionText, { color: colors.textTertiary }]}>Sukoon Version 1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { backgroundColor: '#F4A44A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  versionText: { textAlign: 'center', marginTop: 20, fontSize: 12 },
});
