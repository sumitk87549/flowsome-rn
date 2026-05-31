import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Alert,
  Platform, StatusBar, Dimensions, AppState
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { generateId } from '../../utils/id';
import { useSessionStore } from '../../stores/sessionStore';
import { useUserStore } from '../../stores/userStore';
import { INDIA_THEMES } from '../../constants/themes';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// ─── Safe wrappers for native-only modules ───────────────────────────────────
const isExpoGo = Constants.executionEnvironment === 'storeClient';

let Notifications: any = null;
if (!isExpoGo) {
  try { Notifications = require('expo-notifications'); } catch (_) {}
}

let audioManager: any = null;
try { audioManager = require('../../utils/audio').audioManager; } catch (_) {}

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
  const { updateStreakFromSession } = useUserStore();

  const modeId = params.modeId as string;
  const themeId = params.themeId as string;
  const workDuration = parseInt(params.work as string) || 25;
  const breakDuration = parseInt(params.break as string) || 5;
  const totalCycles = parseInt(params.cycles as string) || 4;

  const theme = INDIA_THEMES.find(t => t.id === themeId) || INDIA_THEMES[0];

  // ── State ──
  const [sessionId] = useState(() => generateId());
  const [phase, setPhase] = useState<'work' | 'break' | 'complete'>('work');
  const [currentCycle, setCurrentCycle] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
  const [isPaused, setIsPaused] = useState(false);
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
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    StatusBar.setHidden(true);

    addFocusSession({
      id: sessionId,
      type: 'focus',
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
    // Slow gradient shift
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 60000, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 60000, useNativeDriver: false }),
      ])
    ).start();

    // Particles float up
    Animated.loop(
      Animated.timing(particlesAnim, { toValue: 1, duration: 25000, useNativeDriver: true })
    ).start();

    // Gentle pulse on ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 3000, useNativeDriver: true }),
      ])
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

  const handleTimerEnd = (currentPhase: 'work' | 'break' | 'complete') => {
    if (currentPhase === 'complete') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        updateStreakFromSession();
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
      if (audioManager) audioManager.playAmbientSound(0.3);
    } else {
      pauseRemainingRef.current = timeRemaining;
      isPausedRef.current = true;
      setIsPaused(true);
      safeNotify.cancelAll();
      if (audioManager) audioManager.fadeAudioOut(500);
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
      <View style={[styles.container, { backgroundColor: '#0A0E16' }]}>
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>Session Complete!</Text>
          <Text style={styles.completeStats}>
            Focused for {workDuration * totalCycles} min · {totalCycles} cycles
          </Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>How focused were you?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => { setRating(star); updateFocusSession(sessionId, { focusRating: star }); }}>
                  <Ionicons name={rating >= star ? 'star' : 'star-outline'} size={36} color={rating >= star ? '#F4A44A' : 'rgba(255,255,255,0.2)'} />
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
  const radius = 110;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const progressFraction = timeRemaining / totalTimeRef.current;
  const strokeDashoffset = circumference - progressFraction * circumference;

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: (theme.gradientColors as string[]).length >= 2
      ? [theme.gradientColors[0], theme.gradientColors[1]]
      : ['#1A3A5C', '#0F2035'],
  });

  // Generate particles once
  const particles = useRef(
    Array.from({ length: 40 }, () => ({
      cx: Math.random() * width,
      cy: Math.random() * (height + 200),
      r: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }))
  ).current;

  return (
    <View style={styles.container}>
      {/* Background */}
      <Animated.View style={[styles.bgLayer, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.particlesLayer, {
          transform: [{
            translateY: particlesAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -150] }),
          }],
          opacity: glowAnim,
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
        {/* Phase label at top */}
        <View style={styles.header}>
          <Text style={styles.phaseLabel}>{phase === 'work' ? '🎯 Focus' : '☕ Break'}</Text>
          <View style={styles.cyclesRow}>
            {Array.from({ length: totalCycles }).map((_, i) => (
              <View key={i} style={[
                styles.cycleDot,
                i < currentCycle - (phase === 'work' ? 1 : 0) && styles.cycleDotFilled,
                i === currentCycle - 1 && phase === 'work' && styles.cycleDotActive,
              ]} />
            ))}
          </View>
        </View>

        {/* Timer Ring */}
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Svg height="280" width="280" viewBox="0 0 280 280">
            <Defs>
              <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="rgba(255,255,255,0.5)" />
                <Stop offset="1" stopColor="rgba(255,255,255,0.15)" />
              </SvgGrad>
            </Defs>
            {/* Background ring */}
            <Circle cx="140" cy="140" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
            {/* Progress ring */}
            <Circle
              cx="140" cy="140" r={radius}
              stroke="url(#ringGrad)" strokeWidth={strokeWidth} fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" rotation="-90" origin="140, 140"
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.timerPhase}>{phase === 'work' ? `Cycle ${currentCycle}/${totalCycles}` : 'Take a breath'}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Always-visible bottom controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.pauseBtn} onPress={handlePauseToggle}>
          <View style={styles.pauseBtnInner}>
            <Ionicons name={isPaused ? 'play' : 'pause'} size={28} color="white" style={isPaused ? { marginLeft: 3 } : undefined} />
          </View>
        </TouchableOpacity>

        <View style={styles.exitBtn}>
          {/* Spacer for symmetry */}
          <Ionicons name="musical-notes" size={22} color="rgba(255,255,255,0.3)" />
        </View>
      </View>

      {isPaused && (
        <View style={styles.pausedOverlay}>
          <Text style={styles.pausedText}>PAUSED</Text>
          <Text style={styles.pausedSub}>Tap play to continue</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  bgLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const,
  particlesLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const,
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' } as const,
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { alignItems: 'center', position: 'absolute', top: 80 },
  phaseLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  cyclesRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  cycleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  cycleDotFilled: { backgroundColor: 'rgba(255,255,255,0.8)' },
  cycleDotActive: { backgroundColor: 'white', shadowColor: 'white', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4, elevation: 2 },

  timerContainer: { alignItems: 'center', justifyContent: 'center', width: 280, height: 280 },
  timerTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timerText: {
    fontSize: 56,
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 3,
    textShadowColor: 'rgba(255,255,255,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  timerPhase: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Always-visible bottom controls
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  exitBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Paused overlay
  pausedOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  pausedText: {
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 6,
    fontSize: 16,
    fontWeight: '700',
  },
  pausedSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 6,
  },

  // Complete
  completeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  completeEmoji: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 28, fontWeight: '700', color: 'white', marginBottom: 8 },
  completeStats: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  ratingContainer: { marginTop: 32, alignItems: 'center' },
  ratingLabel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 16, fontWeight: '500' },
  starsRow: { flexDirection: 'row', gap: 12 },
  returnBtn: {
    marginTop: 40,
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 16,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  returnBtnText: { fontSize: 16, fontWeight: '700', color: '#0A0E16' },
});
