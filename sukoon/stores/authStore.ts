import { create } from 'zustand';
import { firebaseAuth, GoogleSignin, IS_EXPO_GO } from '../services/firebase';

export type SubscriptionStatus = {
  plan: 'free' | 'monthly' | 'annual' | 'lifetime' | 'student';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  expiresAt: number | null;
  isActive: boolean;
};

interface AuthState {
  user: any | null;  // FirebaseAuthTypes.User when available
  isAuthenticated: boolean;
  isGuest: boolean;
  subscription: SubscriptionStatus | null;
  isLoading: boolean;

  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  setAuthUser: (user: any | null) => void;
  setSubscription: (sub: SubscriptionStatus | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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
    if (IS_EXPO_GO || !GoogleSignin || !firebaseAuth) {
      throw new Error('Google Sign-In requires a development build. Use "Continue as Guest" to explore the app in Expo Go.');
    }
    try {
      set({ isLoading: true });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (!idToken) throw new Error('No ID token found');
      const credential = firebaseAuth.GoogleAuthProvider.credential(idToken);
      await firebaseAuth().signInWithCredential(credential);
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    if (IS_EXPO_GO || !firebaseAuth) {
      throw new Error('Sign-in requires a development build. Use "Continue as Guest" to explore the app in Expo Go.');
    }
    try {
      set({ isLoading: true });
      await firebaseAuth().signInWithEmailAndPassword(email, password);
    } finally {
      set({ isLoading: false });
    }
  },

  signUpWithEmail: async (name, email, password) => {
    if (IS_EXPO_GO || !firebaseAuth) {
      throw new Error('Sign-up requires a development build. Use "Continue as Guest" to explore the app in Expo Go.');
    }
    try {
      set({ isLoading: true });
      const userCred = await firebaseAuth().createUserWithEmailAndPassword(email, password);
      await userCred.user.updateProfile({ displayName: name });
      await userCred.user.reload();
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      if (!IS_EXPO_GO && firebaseAuth) {
        await firebaseAuth().signOut();
      }
      if (!IS_EXPO_GO && GoogleSignin) {
        try { await GoogleSignin.signOut(); } catch (_) {}
      }
      set({ user: null, isAuthenticated: false, isGuest: false, subscription: null });
    } finally {
      set({ isLoading: false });
    }
  },

  continueAsGuest: () => {
    set({ isGuest: true, isAuthenticated: false, user: null });
  },
}));
