import { firebaseFirestore, IS_EXPO_GO } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnySession } from '../stores/sessionStore';
import { useAuthStore } from '../stores/authStore';

const PENDING_SYNC_KEY = 'sukoon_pending_sync';

export const syncService = {
  syncLocalDataToFirebase: async (userId: string) => {
    if (IS_EXPO_GO || !firebaseFirestore) return;
    try {
      const userRef = firebaseFirestore().collection('users').doc(userId);
      const userDataStr = await AsyncStorage.getItem('userData');
      const focusData = await AsyncStorage.getItem('sukoon_focus_sessions');
      const breatheData = await AsyncStorage.getItem('sukoon_breathing_sessions');
      const meditateData = await AsyncStorage.getItem('sukoon_meditate_sessions');

      const batch = firebaseFirestore().batch();

      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        batch.set(userRef.collection('profile').doc('settings'), {
          onboardingComplete: userData.onboardingComplete || false,
          goals: userData.goals || [],
          timePreference: userData.timePreference || '15-20 Minutes',
        }, { merge: true });

        batch.set(userRef.collection('streak').doc('stats'), {
          current: userData.streak || 0,
          lastSessionDate: userData.lastSessionDate || null,
          totalSessions: userData.totalSessions || 0,
        }, { merge: true });

        if (userData.moodHistory?.length > 0) {
          batch.set(userRef.collection('mood_history').doc('entries'), { history: userData.moodHistory }, { merge: true });
        }
      }

      const allSessions: AnySession[] = [];
      if (focusData) allSessions.push(...JSON.parse(focusData));
      if (breatheData) allSessions.push(...JSON.parse(breatheData));
      if (meditateData) allSessions.push(...JSON.parse(meditateData));

      allSessions.forEach(session => {
        batch.set(userRef.collection('sessions').doc(session.id), session, { merge: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
    }
  },

  syncFromFirebase: async (userId: string) => {
    if (IS_EXPO_GO || !firebaseFirestore) return;
    try {
      const userRef = firebaseFirestore().collection('users').doc(userId);
      const subDoc = await userRef.collection('subscription').doc('status').get();
      if (subDoc.exists) {
        const data = subDoc.data() as any;
        const isActive = data.status === 'active' && (!data.expiresAt || data.expiresAt > Date.now());
        useAuthStore.getState().setSubscription({
          plan: data.plan || 'free',
          status: data.status || 'trial',
          expiresAt: data.expiresAt || null,
          isActive,
        });
      }
      await syncService.processPendingQueue(userId);
    } catch (error) {
      console.error('Error syncing from Firebase:', error);
    }
  },

  realtimeSyncSession: async (session: AnySession) => {
    if (IS_EXPO_GO || !firebaseFirestore) return;
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) return;
    try {
      await firebaseFirestore().collection('users').doc(userId).collection('sessions').doc(session.id).set(session, { merge: true });
    } catch {
      await syncService.addToPendingQueue('sessions', session.id, session);
    }
  },

  syncStreakToCloud: async (streakData: any) => {
    if (IS_EXPO_GO || !firebaseFirestore) return;
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) return;
    try {
      await firebaseFirestore().collection('users').doc(userId).collection('streak').doc('stats').set(streakData, { merge: true });
    } catch {
      await syncService.addToPendingQueue('streak', 'stats', streakData);
    }
  },

  addToPendingQueue: async (collection: string, docId: string, data: any) => {
    try {
      const qStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const queue = qStr ? JSON.parse(qStr) : [];
      queue.push({ collection, docId, data, timestamp: Date.now() });
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to add to sync queue', e);
    }
  },

  processPendingQueue: async (userId: string) => {
    if (IS_EXPO_GO || !firebaseFirestore) return;
    try {
      const qStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      if (!qStr) return;
      const queue = JSON.parse(qStr);
      if (queue.length === 0) return;
      const batch = firebaseFirestore().batch();
      const userRef = firebaseFirestore().collection('users').doc(userId);
      queue.forEach((item: any) => {
        batch.set(userRef.collection(item.collection).doc(item.docId), item.data, { merge: true });
      });
      await batch.commit();
      await AsyncStorage.removeItem(PENDING_SYNC_KEY);
    } catch (e) {
      console.error('Failed to process sync queue', e);
    }
  },
};
