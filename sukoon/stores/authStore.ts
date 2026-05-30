import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export type SubscriptionStatus = {
  plan: 'free' | 'monthly' | 'annual' | 'lifetime' | 'student';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  expiresAt: number | null;
  isActive: boolean;
};

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  
  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  setAuthUser: (user: FirebaseAuthTypes.User | null) => void;
  setSubscription: (sub: SubscriptionStatus | null) => void;
}

// In production, configure this in your app entry point
// GoogleSignin.configure({ webClientId: 'YOUR_WEB_CLIENT_ID' });

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  subscription: null,
  isLoading: false,

  setAuthUser: (user) => {
    set({ user, isAuthenticated: !!user, isGuest: false });
  },

  setSubscription: (sub) => {
    set({ subscription: sub });
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      let idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error('No ID token found');
      
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      set({ isLoading: true });
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signUpWithEmail: async (name, email, password) => {
    try {
      set({ isLoading: true });
      const userCred = await auth().createUserWithEmailAndPassword(email, password);
      await userCred.user.updateProfile({ displayName: name });
      // Force token refresh to pick up the new displayName
      await userCred.user.reload();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await auth().signOut();
      try {
        await GoogleSignin.signOut();
      } catch (e) {}
      set({ user: null, isAuthenticated: false, isGuest: false, subscription: null });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  continueAsGuest: () => {
    set({ isGuest: true, isAuthenticated: false, user: null });
  },
}));
