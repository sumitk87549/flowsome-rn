import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

interface AppState {
  colorScheme: 'light' | 'dark' | 'system';
  language: 'en' | 'hi';
  toggleColorScheme: () => void;
  toggleLanguage: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  colorScheme: 'system',
  language: 'en',
  
  toggleColorScheme: () => {
    const nextScheme = get().colorScheme === 'light' ? 'dark' : get().colorScheme === 'dark' ? 'system' : 'light';
    set({ colorScheme: nextScheme });
    get().saveToStorage();
  },
  
  toggleLanguage: () => {
    const nextLang = get().language === 'en' ? 'hi' : 'en';
    set({ language: nextLang });
    i18n.changeLanguage(nextLang);
    get().saveToStorage();
  },
  
  loadFromStorage: async () => {
    try {
      const scheme = await AsyncStorage.getItem('colorScheme') as 'light' | 'dark' | 'system';
      const lang = await AsyncStorage.getItem('language') as 'en' | 'hi';
      if (scheme) set({ colorScheme: scheme });
      if (lang) {
        set({ language: lang });
        i18n.changeLanguage(lang);
      }
    } catch (e) {
      console.error('Failed to load app settings from storage', e);
    }
  },
  
  saveToStorage: async () => {
    try {
      const { colorScheme, language } = get();
      await AsyncStorage.setItem('colorScheme', colorScheme);
      await AsyncStorage.setItem('language', language);
    } catch (e) {
      console.error('Failed to save app settings to storage', e);
    }
  }
}));
