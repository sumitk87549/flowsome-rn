import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { PLANS } from '../constants/pricing';
import { IS_EXPO_GO } from '../services/firebase';
import { useAuthStore } from '../stores/authStore';
import { syncService } from '../services/sync';

// react-native-razorpay requires native modules — guard for Expo Go
let RazorpayCheckout: any = null;
if (!IS_EXPO_GO) {
  try { RazorpayCheckout = require('react-native-razorpay').default; } catch (_) {}
}

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal = ({ visible, onClose }: PaywallModalProps) => {
  const { t, language } = useTranslation();
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>('annual');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (IS_EXPO_GO || !RazorpayCheckout) {
      alert('Payments require a development build. In Expo Go, your subscription is simulated locally for testing.');
      // Simulate a successful subscription for UI testing
      useAuthStore.getState().setSubscription({
        plan: selectedPlan,
        status: 'active',
        expiresAt: selectedPlan === 'lifetime' ? null : Date.now() + 30 * 24 * 60 * 60 * 1000,
        isActive: true
      });
      onClose();
      return;
    }

    if (!user) {
      alert("Please sign in to subscribe.");
      onClose();
      return;
    }

    setLoading(true);
    try {
      const plan = PLANS[selectedPlan];
      const options = {
        description: plan.name,
        image: 'https://your-logo-url.png',
        currency: plan.currency,
        key: 'rzp_test_YOUR_KEY_HERE',
        amount: plan.price * 100,
        name: 'Sukoon',
        prefill: {
          email: user.email || '',
          contact: '',
          name: user.displayName || ''
        },
        theme: { color: '#F4A44A' }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        useAuthStore.getState().setSubscription({
          plan: selectedPlan,
          status: 'active',
          expiresAt: selectedPlan === 'lifetime' ? null : Date.now() + 30 * 24 * 60 * 60 * 1000,
          isActive: true
        });
        if (user.uid) await syncService.syncLocalDataToFirebase(user.uid);
        setLoading(false);
        onClose();
      }).catch((error: any) => {
        alert(`Payment failed: ${error.description || 'Unknown error'}`);
        setLoading(false);
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Maybe later</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.headerTitle}>
            {language === 'en' ? 'Unlock Sukoon +' : 'सुकून + अनलॉक करें'}
          </Text>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="earth" size={24} color="#F4A44A" />
              <Text style={styles.featureText}>All 8 India environments</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="moon" size={24} color="#F4A44A" />
              <Text style={styles.featureText}>50+ guided sessions (Hindi & English)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cloud" size={24} color="#F4A44A" />
              <Text style={styles.featureText}>Cloud sync — never lose your streak</Text>
            </View>
          </View>

          <View style={styles.plansContainer}>
            {['monthly', 'annual', 'lifetime', 'student'].map((key) => {
              const plan = PLANS[key as keyof typeof PLANS];
              const isSelected = selectedPlan === key;
              return (
                <TouchableOpacity 
                  key={key} 
                  style={[styles.planCard, isSelected && styles.planCardActive]}
                  onPress={() => setSelectedPlan(key as keyof typeof PLANS)}
                >
                  {plan.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{language === 'en' ? plan.name : plan.nameHi}</Text>
                    <View style={styles.priceContainer}>
                      {plan.originalPrice && <Text style={styles.originalPrice}>₹{plan.originalPrice}</Text>}
                      <Text style={styles.planPrice}>₹{plan.price}</Text>
                    </View>
                  </View>
                  <Text style={styles.planDesc}>{language === 'en' ? plan.description : plan.descriptionHi}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(selectedPlan === 'monthly' || selectedPlan === 'annual') && (
            <Text style={styles.trialText}>Start 7-day free trial — no card needed for trial start</Text>
          )}

          <TouchableOpacity 
            style={styles.ctaBtn} 
            onPress={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.ctaText}>
                {selectedPlan === 'lifetime' ? 'Buy Lifetime' : 'Start Trial'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.finePrint}>
            Cancel anytime in Settings. No charges during trial.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  closeBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 8 },
  closeText: { fontSize: 14, color: '#666', fontWeight: '500' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1A1A18', textAlign: 'center', marginBottom: 32 },
  
  features: { gap: 16, marginBottom: 40 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 16, color: '#333' },

  plansContainer: { gap: 16, marginBottom: 24 },
  planCard: { 
    borderWidth: 2, 
    borderColor: '#EFEFEF', 
    borderRadius: 16, 
    padding: 16, 
    backgroundColor: 'white',
    position: 'relative'
  },
  planCardActive: { borderColor: '#F4A44A', backgroundColor: '#FFF9F2' },
  badge: { position: 'absolute', top: -12, right: 16, backgroundColor: '#F4A44A', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A18' },
  priceContainer: { alignItems: 'flex-end' },
  planPrice: { fontSize: 20, fontWeight: 'bold', color: '#1A1A18' },
  originalPrice: { fontSize: 12, textDecorationLine: 'line-through', color: '#999' },
  planDesc: { fontSize: 12, color: '#666' },

  trialText: { textAlign: 'center', fontSize: 14, color: '#2D8B6F', fontWeight: '600', marginBottom: 24 },

  ctaBtn: { backgroundColor: '#F4A44A', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  ctaText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  finePrint: { textAlign: 'center', fontSize: 12, color: '#999' },
});
