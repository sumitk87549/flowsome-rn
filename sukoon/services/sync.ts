import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnySession } from '../stores/sessionStore';
import { useAuthStore } from '../stores/authStore';

const PENDING_SYNC_KEY = 'sukoon_pending_sync';

export const syncService = {
  // 1. Initial Sync (Local -> Firebase) run after first sign-in/up
  syncLocalDataToFirebase: async (userId: string) => {
    try {
      const userRef = firestore().collection('users').doc(userId);
      
      // Get all local data
      const userDataStr = await AsyncStorage.getItem('userData');
      const focusData = await AsyncStorage.getItem('sukoon_focus_sessions');
      const breatheData = await AsyncStorage.getItem('sukoon_breathing_sessions');
      const meditateData = await AsyncStorage.getItem('sukoon_meditate_sessions');
      
      const batch = firestore().batch();
      
      // Sync Profile & Streak
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const profile = {
          onboardingComplete: userData.onboardingComplete || false,
          goals: userData.goals || [],
          timePreference: userData.timePreference || '15-20 Minutes',
          selectedTimerMode: userData.selectedTimerMode || 'classic',
          selectedBreathGoal: userData.selectedBreathGoal || 'calm',
        };
        batch.set(userRef.collection('profile').doc('settings'), profile, { merge: true });
        
        const streak = {
          current: userData.streak || 0,
          lastSessionDate: userData.lastSessionDate || null,
          totalSessions: userData.totalSessions || 0,
          totalFocusMinutes: userData.totalFocusMinutes || 0,
        };
        batch.set(userRef.collection('streak').doc('stats'), streak, { merge: true });
        
        if (userData.moodHistory && userData.moodHistory.length > 0) {
          batch.set(userRef.collection('mood_history').doc('entries'), { history: userData.moodHistory }, { merge: true });
        }
      }
      
      // Sync Sessions
      const allSessions: AnySession[] = [];
      if (focusData) allSessions.push(...JSON.parse(focusData));
      if (breatheData) allSessions.push(...JSON.parse(breatheData));
      if (meditateData) allSessions.push(...JSON.parse(meditateData));
      
      allSessions.forEach(session => {
        const sessionRef = userRef.collection('sessions').doc(session.id);
        batch.set(sessionRef, session, { merge: true });
      });
      
      await batch.commit();
      console.log('Successfully synced local data to Firebase');
    } catch (error) {
      console.error('Error syncing local data to Firebase:', error);
    }
  },

  // 2. Fetch from Cloud (Firebase -> Local)
  syncFromFirebase: async (userId: string) => {
    try {
      const userRef = firestore().collection('users').doc(userId);
      
      // Get subscription
      const subDoc = await userRef.collection('subscription').doc('status').get();
      if (subDoc.exists) {
        const subData = subDoc.data() as any;
        const isActive = subData.status === 'active' && (!subData.expiresAt || subData.expiresAt > Date.now());
        useAuthStore.getState().setSubscription({
          plan: subData.plan || 'free',
          status: subData.status || 'trial',
          expiresAt: subData.expiresAt || null,
          isActive
        });
      }
      
      // Process pending queue first to avoid overwriting local new sessions
      await syncService.processPendingQueue(userId);
      
    } catch (error) {
      console.error('Error syncing from Firebase:', error);
    }
  },

  // 3. Realtime session sync
  realtimeSyncSession: async (session: AnySession) => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) return; // Guest mode

    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(session.id)
        .set(session, { merge: true });
    } catch (error) {
      console.warn('Network offline, queueing session sync');
      await syncService.addToPendingQueue('sessions', session.id, session);
    }
  },

  // 4. Streak & Profile updates
  syncStreakToCloud: async (streakData: any) => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) return;

    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('streak')
        .doc('stats')
        .set(streakData, { merge: true });
    } catch (error) {
      await syncService.addToPendingQueue('streak', 'stats', streakData);
    }
  },

  // --- Offline Queue Helpers ---
  addToPendingQueue: async (collection: string, docId: string, data: any) => {
    try {
      const qStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const queue = qStr ? JSON.parse(qStr) : [];
      queue.push({ collection, docId, data, timestamp: Date.now() });
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to add to sync queue", e);
    }
  },

  processPendingQueue: async (userId: string) => {
    try {
      const qStr = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      if (!qStr) return;
      
      const queue = JSON.parse(qStr);
      if (queue.length === 0) return;
      
      const batch = firestore().batch();
      const userRef = firestore().collection('users').doc(userId);
      
      queue.forEach((item: any) => {
        const ref = userRef.collection(item.collection).doc(item.docId);
        batch.set(ref, item.data, { merge: true });
      });
      
      await batch.commit();
      await AsyncStorage.removeItem(PENDING_SYNC_KEY);
      console.log(`Processed ${queue.length} items from sync queue`);
    } catch (e) {
      console.error("Failed to process sync queue", e);
    }
  }
};
