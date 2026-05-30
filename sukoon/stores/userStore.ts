import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  onboardingComplete: boolean;
  goals: string[];
  timePreference: string;
  streak: number;
  lastSessionDate: string | null;
  moodHistory: Array<{ mood: number, timestamp: string }>;
  selectedTimerMode: string;
  selectedBreathGoal: string;
  totalFocusMinutes: number;
  totalSessions: number;
  weeklyActivity: { [dateString: string]: number };
  setOnboardingComplete: (complete: boolean) => void;
  setGoals: (goals: string[]) => void;
  setTimePreference: (time: string) => void;
  logMood: (mood: number) => void;
  setSelectedTimerMode: (mode: string) => void;
  setSelectedBreathGoal: (goal: string) => void;
  updateStreakFromSession: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  onboardingComplete: false,
  goals: [],
  timePreference: '15-20 Minutes',
  streak: 0,
  lastSessionDate: null,
  moodHistory: [],
  selectedTimerMode: 'classic',
  selectedBreathGoal: 'calm',
  totalFocusMinutes: 0,
  totalSessions: 0,
  weeklyActivity: {},

  setOnboardingComplete: (complete) => {
    set({ onboardingComplete: complete });
    get().saveToStorage();
  },
  setGoals: (goals) => {
    set({ goals });
    get().saveToStorage();
  },
  setTimePreference: (timePreference) => {
    set({ timePreference });
    get().saveToStorage();
  },
  logMood: (mood) => {
    const newMood = { mood, timestamp: new Date().toISOString() };
    set((state) => ({ moodHistory: [...state.moodHistory, newMood] }));
    get().saveToStorage();
  },
  setSelectedTimerMode: (mode) => {
    set({ selectedTimerMode: mode });
    get().saveToStorage();
  },
  setSelectedBreathGoal: (goal) => {
    set({ selectedBreathGoal: goal });
    get().saveToStorage();
  },
  updateStreakFromSession: () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toDateString();
    
    const state = get();
    const lastSessionDate = state.lastSessionDate;
    
    // Update weekly activity
    const newWeeklyActivity = { ...state.weeklyActivity };
    newWeeklyActivity[todayStr] = (newWeeklyActivity[todayStr] || 0) + 1;
    
    let newStreak = state.streak;
    
    if (lastSessionDate === todayStr) {
      // Already counted today
    } else {
      if (lastSessionDate) {
        const lastDate = new Date(lastSessionDate);
        lastDate.setHours(0,0,0,0);
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          newStreak += 1;
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
        }
      } else {
        // First session ever
        newStreak = 1;
      }
    }
    
    set({
      streak: newStreak,
      lastSessionDate: todayStr,
      totalSessions: state.totalSessions + 1,
      weeklyActivity: newWeeklyActivity
    });
    
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const dataStr = await AsyncStorage.getItem('userData');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        set({ ...data });
      }
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      const dataToSave = {
        onboardingComplete: state.onboardingComplete,
        goals: state.goals,
        timePreference: state.timePreference,
        streak: state.streak,
        lastSessionDate: state.lastSessionDate,
        moodHistory: state.moodHistory,
        selectedTimerMode: state.selectedTimerMode,
        selectedBreathGoal: state.selectedBreathGoal,
        totalFocusMinutes: state.totalFocusMinutes,
        totalSessions: state.totalSessions,
        weeklyActivity: state.weeklyActivity,
      };
      await AsyncStorage.setItem('userData', JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save user data', e);
    }
  }
}));
