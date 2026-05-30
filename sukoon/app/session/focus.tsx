import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Alert,
  Platform, StatusBar, Dimensions, AppState
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { v4 as uuidv4 } from 'uuid';
import { useSessionStore } from '../../stores/sessionStore';
import { INDIA_THEMES } from '../../constants/themes';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// ─── Safe wrappers for native-only modules ───────────────────────────────────
// expo-notifications throws a MODULE-LEVEL error in Expo Go SDK 53+.
// try/catch around require() is NOT enough — must check executionEnvironment first.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

let Notifications: any = null;
if (!isExpoGo) {
  try { Notifications = require('expo-notifications'); } catch (_) {}
}

let audioManager: any = null;
try { audioManager = require('../../utils/audio').audioManager; } catch (_) {}

// Only configure the handler if the module loaded successfully
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (_) {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const safeNotify = {
  schedule: async (seconds: number, title: string, body: string) => {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: { seconds },
      });
    } catch (_) {}
  },
  cancelAll: () => {
    if (!Notifications) return;
    try { Notifications.cancelAllScheduledNotificationsAsync(); } catch (_) {}
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function FocusSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addFocusSession, updateFocusSession } = useSessionStore();

  const modeId = params.modeId as string;
  const themeId = params.themeId as string;
  const workDuration = parseInt(params.work as string) || 25;
  const breakDuration = parseInt(params.break as string) || 5;
  const totalCycles = parseInt(params.cycles as string) || 4;

  const theme = INDIA_THEMES.find(t => t.id === themeId) || INDIA_THEMES[0];

  // ── State ──
  const [sessionId] = useState(() => uuidv4());
  const [phase, setPhase] = useState<'work' | 'break' | 'complete'>('work');
  const [currentCycle, setCurrentCycle] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [rating, setRating] = useState(0);

  // ── Refs ──
  const endTimeRef = useRef<number>(0);
  const totalTimeRef = useRef<number>(workDuration * 60);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const pauseRemainingRef = useRef<number>(0);
  const phaseRef = useRef<'work' | 'break' | 'complete'>('work');
  const isPausedRef = useRef(false);

  // ── Animations ──
  const bgAnim = useRef(new Animated.Value(0)).current;
  const particlesAnim = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    StatusBar.setHidden(true);

    addFocusSession({
      id: sessionId,
      themeId: theme.id,
      mode: modeId,
      plannedDuration: workDuration,
      actualDuration: 0,
      startTime: Date.now(),
      status: 'in-progress',
      cycles: 0,
    });

    startAnimations();

    if (audioManager) {
      audioManager.loadThemeAudio(theme.id).then(() => {
        audioManager.playAmbientSound(0.3);
      });
    }

    startTimer(workDuration * 60, 'work');

    const sub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (!isPausedRef.current && endTimeRef.current > 0) {
          const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
          setTimeRemaining(rem);
        }
      }
      appState.current = next;
    });

    return () => {
      StatusBar.setHidden(false);
      sub.remove();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioManager) audioManager.fadeAudioOut(1000);
      safeNotify.cancelAll();
    };
  }, []);

  const startAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 60000, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 60000, useNativeDriver: false }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(particlesAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  };

  const startTimer = (seconds: number, currentPhase: 'work' | 'break') => {
    totalTimeRef.current = seconds;
    endTimeRef.current = Date.now() + seconds * 1000;
    setTimeRemaining(seconds);

    const title = currentPhase === 'work' ? 'Break time! 🧘' : 'Back to focus! 🎯';
    const body = currentPhase === 'work' ? 'Great work — time to breathe.' : 'Break is over.';
    safeNotify.schedule(seconds, title, body);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) {
        clearInterval(timerIntervalRef.current!);
        handleTimerEnd(phaseRef.current);
      }
    }, 1000);
  };

  const handleTimerEnd = (currentPhase: 'work' | 'break') => {
    if (audioManager) audioManager.playChime?.();

    if (currentPhase === 'work') {
      updateFocusSession(sessionId, { actualDuration: workDuration, cycles: currentCycle });
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        const nextPhase = 'break';
        setPhase(nextPhase);
        phaseRef.current = nextPhase;
        startTimer(breakDuration * 60, nextPhase);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    } else {
      if (currentCycle >= totalCycles) {
        setPhase('complete');
        phaseRef.current = 'complete';
        if (audioManager) audioManager.fadeAudioOut(2000);
        updateFocusSession(sessionId, { status: 'completed', endTime: Date.now() });
      } else {
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          const nextPhase = 'work';
          setPhase(nextPhase);
          phaseRef.current = nextPhase;
          setCurrentCycle(c => c + 1);
          startTimer(workDuration * 60, nextPhase);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
      }
    }
  };

  const handlePauseToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPausedRef.current) {
      endTimeRef.current = Date.now() + pauseRemainingRef.current * 1000;
      isPausedRef.current = false;
      setIsPaused(false);
      safeNotify.schedule(pauseRemainingRef.current, 'Timer Update', 'Timer finished');
    } else {
      pauseRemainingRef.current = timeRemaining;
      isPausedRef.current = true;
      setIsPaused(true);
      safeNotify.cancelAll();
    }
  };

  const handleScreenTap = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (!isPausedRef.current) {
      setTimeout(() => {
        Animated.timing(controlsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
          () => setShowControls(false)
        );
      }, 3000);
    }
  };

  const handleExit = () => {
    Alert.alert('End session?', 'Your progress so far will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive', onPress: () => {
          updateFocusSession(sessionId, {
            status: 'abandoned',
            actualDuration: workDuration - Math.floor(timeRemaining / 60),
            endTime: Date.now(),
          });
          router.back();
        }
      },
    ]);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Completion Screen ──
  if (phase === 'complete') {
    return (
      <View style={[styles.container, { backgroundColor: '#1A3A5C' }]}>
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>Session Complete!</Text>
          <Text style={styles.completeStats}>Focused for {workDuration * totalCycles} min · {totalCycles} cycles</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>How focused were you?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => { setRating(star); updateFocusSession(sessionId, { focusRating: star }); }}>
                  <Ionicons name={rating >= star ? 'star' : 'star-outline'} size={40} color={rating >= star ? '#F4A44A' : 'rgba(255,255,255,0.3)'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.returnBtn} onPress={() => router.back()}>
            <Text style={styles.returnBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Progress Ring ──
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeRemaining / totalTimeRef.current) * circumference;

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: (theme.gradientColors as string[]).length >= 2
      ? [theme.gradientColors[0], theme.gradientColors[1]]
      : ['#1A3A5C', '#0F2035'],
  });

  // Generate particles once (stable positions)
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      cx: Math.random() * width,
      cy: Math.random() * (height + 200),
      r: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1,
    }))
  ).current;

  return (
    <TouchableOpacity activeOpacity={1} style={styles.container} onPress={handleScreenTap}>
      {/* Background */}
      <Animated.View style={[styles.bgLayer, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.particlesLayer, {
          transform: [{
            translateY: particlesAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }),
          }],
        }]}>
          <Svg height={height + 200} width={width}>
            {particles.map((p, i) => (
              <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="white" opacity={p.opacity} />
            ))}
          </Svg>
        </Animated.View>
        <View style={styles.overlay} />
      </Animated.View>

      {/* Main content */}
      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.phaseLabel}>{phase === 'work' ? 'Focus' : 'Break'}</Text>
          <View style={styles.cyclesRow}>
            {Array.from({ length: totalCycles }).map((_, i) => (
              <View key={i} style={[styles.cycleDot, i < currentCycle - (phase === 'work' ? 1 : 0) && styles.cycleDotFilled]} />
            ))}
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Svg height="300" width="300" viewBox="0 0 300 300">
            <Circle cx="150" cy="150" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth="6" fill="none" />
            <Circle
              cx="150" cy="150" r={radius}
              stroke="rgba(255,255,255,0.8)" strokeWidth="6" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" rotation="-90" origin="150, 150"
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Controls overlay */}
      {showControls && (
        <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePauseToggle}>
            <Ionicons name={isPaused ? 'play' : 'pause'} size={32} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {isPaused && !showControls && (
        <View style={styles.pausedIndicator}>
          <Text style={styles.pausedText}>PAUSED</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  bgLayer: { ...StyleSheet.absoluteFillObject },
  particlesLayer: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', position: 'absolute', top: 100 },
  phaseLabel: { fontSize: 20, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, textTransform: 'uppercase' },
  cyclesRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  cycleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  cycleDotFilled: { backgroundColor: 'white' },
  timerContainer: { alignItems: 'center', justifyContent: 'center', width: 300, height: 300 },
  timerTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timerText: {
    fontSize: 72,
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 4,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  controlsOverlay: { ...StyleSheet.absoluteFillObject, padding: 30 },
  exitBtn: { position: 'absolute', top: 50, left: 24, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22 },
  pauseBtn: { position: 'absolute', bottom: 80, alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  pausedIndicator: { position: 'absolute', bottom: 100, alignSelf: 'center' },
  pausedText: { color: 'rgba(255,255,255,0.5)', letterSpacing: 4, fontSize: 14, fontWeight: 'bold' },
  completeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  completeEmoji: { fontSize: 80, marginBottom: 20 },
  completeTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  completeStats: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  ratingContainer: { marginTop: 40, alignItems: 'center' },
  ratingLabel: { fontSize: 16, color: 'white', marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 12 },
  returnBtn: { marginTop: 60, backgroundColor: 'white', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16 },
  returnBtnText: { fontSize: 18, fontWeight: 'bold', color: '#1A3A5C' },
});
