/**
 * services/firebase.ts
 *
 * Central gateway for all @react-native-firebase/* modules.
 * @react-native-firebase throws MODULE-LEVEL (uncatchable) errors in Expo Go.
 * This file guards every require with an executionEnvironment check so nothing
 * is ever loaded in Expo Go — not even partially.
 */
import Constants from 'expo-constants';

export const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

// ─── Raw module references (null in Expo Go) ──────────────────────────────
let _auth: any = null;
let _firestore: any = null;
let _googleSignin: any = null;

if (!IS_EXPO_GO) {
  try { _auth = require('@react-native-firebase/auth').default; } catch (_) {}
  try { _firestore = require('@react-native-firebase/firestore').default; } catch (_) {}
  try { _googleSignin = require('@react-native-google-signin/google-signin').GoogleSignin; } catch (_) {}
}

export const firebaseAuth = _auth;
export const firebaseFirestore = _firestore;
export const GoogleSignin = _googleSignin;
export const isFirebaseAvailable = !IS_EXPO_GO && !!_auth;
