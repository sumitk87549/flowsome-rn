import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FocusSession = {
  id: string;
  type: 'focus';
  themeId: string;
  mode: string;
  plannedDuration: number;
  actualDuration: number;
  startTime: number;
  endTime?: number;
  status: 'in-progress' | 'completed' | 'abandoned';
  focusRating?: number;
  cycles: number;
};

export type BreathingSession = {
  id: string;
  type: 'breathe';
  techniqueId: string;
  rounds: number;
  completedRounds: number;
  duration: number;
  startTime: number;
  timestamp: number;
};

export type MeditationSession = {
  id: string;
  type: 'meditate';
  meditationId: string;
  duration: number; // in minutes
  startTime: number;
  endTime?: number;
  rating?: number;
  feeling?: string;
  status: 'in-progress' | 'completed' | 'abandoned';
};

export type AnySession = FocusSession | BreathingSession | MeditationSession;

interface SessionState {
  focusSessions: FocusSession[];
  breathingSessions: BreathingSession[];
  meditationSessions: MeditationSession[];
  
  // Computed
  todayFocusMinutes: () => number;
  todayBreathingRounds: () => number;
  getSessionsByDateRange: (start: Date, end: Date) => AnySession[];
  getSessionsByType: (type: 'focus'|'breathe'|'meditate') => AnySession[];
  getTotalMinutes: () => number;
  getWeeklyActivity: () => { [day: string]: number };
  
  // Actions
  addFocusSession: (session: FocusSession) => void;
  updateFocusSession: (id: string, updates: Partial<FocusSession>) => void;
  addBreathingSession: (session: BreathingSession) => void;
  addMeditationSession: (session: MeditationSession) => void;
  updateMeditationSession: (id: string, updates: Partial<MeditationSession>) => void;
  getAllSessions: () => AnySession[];
  
  // Persistence
  loadFromStorage: () => Promise<void>;
  persistToStorage: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  focusSessions: [],
  breathingSessions: [],
  meditationSessions: [],

  todayFocusMinutes: () => {
    const today = new Date().toDateString();
    return get().focusSessions
      .filter(s => new Date(s.startTime).toDateString() === today && s.status === 'completed')
      .reduce((total, s) => total + s.actualDuration, 0);
  },

  todayBreathingRounds: () => {
    const today = new Date().toDateString();
    return get().breathingSessions
      .filter(s => new Date(s.startTime).toDateString() === today)
      .reduce((total, s) => total + s.completedRounds, 0);
  },

  getSessionsByDateRange: (start, end) => {
    const all = get().getAllSessions();
    return all.filter(s => s.startTime >= start.getTime() && s.startTime <= end.getTime());
  },

  getSessionsByType: (type) => {
    if (type === 'focus') return get().focusSessions;
    if (type === 'breathe') return get().breathingSessions;
    if (type === 'meditate') return get().meditationSessions;
    return [];
  },

  getTotalMinutes: () => {
    let total = 0;
    get().focusSessions.filter(s => s.status === 'completed').forEach(s => total += s.actualDuration);
    get().breathingSessions.forEach(s => total += Math.round(s.duration / 60));
    get().meditationSessions.filter(s => s.status === 'completed').forEach(s => total += s.duration);
    return total;
  },

  getWeeklyActivity: () => {
    const activity: { [day: string]: number } = {};
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const all = get().getAllSessions();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * oneDay);
      activity[d.toDateString()] = 0;
    }
    
    all.forEach(s => {
      if (s.status === 'abandoned') return;
      const dStr = new Date(s.startTime).toDateString();
      if (activity[dStr] !== undefined) {
        activity[dStr]++;
      }
    });
    return activity;
  },

  addFocusSession: (session) => {
    set((state) => ({ focusSessions: [...state.focusSessions, { ...session, type: 'focus' }] }));
    get().persistToStorage();
  },

  updateFocusSession: (id, updates) => {
    set((state) => ({
      focusSessions: state.focusSessions.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }));
    get().persistToStorage();
  },

  addBreathingSession: (session) => {
    set((state) => ({ breathingSessions: [...state.breathingSessions, { ...session, type: 'breathe' }] }));
    get().persistToStorage();
  },

  addMeditationSession: (session) => {
    set((state) => ({ meditationSessions: [...state.meditationSessions, { ...session, type: 'meditate' }] }));
    get().persistToStorage();
  },

  updateMeditationSession: (id, updates) => {
    set((state) => ({
      meditationSessions: state.meditationSessions.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }));
    get().persistToStorage();
  },

  getAllSessions: () => {
    return [
      ...get().focusSessions,
      ...get().breathingSessions,
      ...get().meditationSessions
    ].sort((a, b) => b.startTime - a.startTime);
  },

  loadFromStorage: async () => {
    try {
      const focusData = await AsyncStorage.getItem('sukoon_focus_sessions');
      const breatheData = await AsyncStorage.getItem('sukoon_breathing_sessions');
      const meditateData = await AsyncStorage.getItem('sukoon_meditate_sessions');
      
      if (focusData) set({ focusSessions: JSON.parse(focusData) });
      if (breatheData) set({ breathingSessions: JSON.parse(breatheData) });
      if (meditateData) set({ meditationSessions: JSON.parse(meditateData) });
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  },

  persistToStorage: async () => {
    try {
      await AsyncStorage.setItem('sukoon_focus_sessions', JSON.stringify(get().focusSessions));
      await AsyncStorage.setItem('sukoon_breathing_sessions', JSON.stringify(get().breathingSessions));
      await AsyncStorage.setItem('sukoon_meditate_sessions', JSON.stringify(get().meditationSessions));
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
  }
}));
