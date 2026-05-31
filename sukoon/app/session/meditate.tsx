import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert, Platform, StatusBar, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSessionStore } from '../../stores/sessionStore';
import { MEDITATIONS } from '../../constants/meditations';
import { generateId } from '../../utils/id';
import { useUserStore } from '../../stores/userStore';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Safe audio
let Audio: any = null;
try { Audio = require('expo-av').Audio; } catch (_) {}

const createSound = async (uri: string, options: any = {}) => {
  if (!Audio) return null;
  try {
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false, ...options });
    return sound;
  } catch (e) {
    console.warn("Audio loading failed", e);
    return null;
  }
};

// Ambient sound URLs for meditation
const AMBIENT_URLS: Record<string, string> = {
  sleep: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_3489839ebf.mp3',  // rain
  focus: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c25ca4ff.mp3',  // ambient
  stress: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_3489839ebf.mp3', // rain
  morning: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c25ca4ff.mp3', // nature
};

export default function MeditateSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const meditationId = params.id as string;
  const lang = (params.lang as string) || 'en';

  const meditation = MEDITATIONS.find(m => m.id === meditationId) || MEDITATIONS[0];
  const { addMeditationSession, updateMeditationSession } = useSessionStore();
  const { updateStreakFromSession } = useUserStore();

  // State
  const [sessionId] = useState(() => generateId());
  const [phase, setPhase] = useState<'loading' | 'playing' | 'paused' | 'complete'>('loading');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ambientSound, setAmbientSound] = useState<any>(null);
  const [chimeSound, setChimeSound] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [scriptIndex, setScriptIndex] = useState(0);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const durationMs = meditation.duration * 60 * 1000;

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scriptFadeAnim = useRef(new Animated.Value(1)).current;
  const particlesAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.2)).current;

  // Script segments
  const scriptSegments = [
    meditation.script_preview || '',
    'Close your eyes gently. Let your breath flow naturally.',
    'Notice where your body holds tension. Release it with each exhale.',
    'You are safe. You are calm. There is nothing to do right now.',
    'Let each breath bring you deeper into stillness.',
  ];

  useEffect(() => {
    StatusBar.setHidden(true);

    addMeditationSession({
      id: sessionId,
      type: 'meditate',
      meditationId: meditation.id,
      duration: meditation.duration,
      startTime: Date.now(),
      status: 'in-progress'
    });

    startAnimations();
    Animated.timing(fadeAnim, { toValue: 1, duration: 2000, useNativeDriver: true }).start();

    const setupAudio = async () => {
      if (Audio) {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });
        } catch (_) {}
      }

      // Load ambient based on category
      const ambientUrl = AMBIENT_URLS[meditation.category] || AMBIENT_URLS.stress;
      const ambient = await createSound(ambientUrl, { isLooping: true, volume: 0.2 });
      setAmbientSound(ambient);

      const chime = await createSound('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3', { volume: 0.6 });
      setChimeSound(chime);

      setTimeout(() => {
        setPhase('playing');
        startTimeRef.current = Date.now();
        startTimer();
        if (ambient) {
          try { ambient.playAsync(); } catch (e) {}
        }
      }, 2500);
    };

    setupAudio();

    return () => {
      StatusBar.setHidden(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (ambientSound) try { ambientSound.unloadAsync(); } catch (e) {}
      if (chimeSound) try { chimeSound.unloadAsync(); } catch (e) {}
    };
  }, []);

  // Cycle through script segments
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(scriptFadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(scriptFadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
      setScriptIndex(prev => (prev + 1) % scriptSegments.length);
    }, 20000);
    return () => clearInterval(interval);
  }, [phase]);

  const startAnimations = () => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 90000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 5000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.94, duration: 5000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(particlesAnim, { toValue: 1, duration: 40000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.4, duration: 4000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.15, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const initialElapsed = elapsedRef.current;
    const start = Date.now() - initialElapsed;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const newElapsed = now - start;
      elapsedRef.current = newElapsed;
      setProgress(Math.min(newElapsed / durationMs, 1));
      setElapsed(Math.floor(newElapsed / 1000));

      if (newElapsed >= durationMs) {
        handleComplete();
      }
    }, 1000);
  };

  const handleComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Fade out ambient
    if (ambientSound) {
      try {
        for (let i = 1; i <= 10; i++) {
          await ambientSound.setVolumeAsync(Math.max(0, 0.2 - (0.2 * (i / 10))));
          await new Promise(r => setTimeout(r, 150));
        }
        await ambientSound.pauseAsync();
      } catch (e) {}
    }

    if (chimeSound) try { await chimeSound.playAsync(); } catch (e) {}

    setPhase('complete');
    updateMeditationSession(sessionId, { status: 'completed', endTime: Date.now() });
    updateStreakFromSession();
  };

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ambientSound) try { await ambientSound.pauseAsync(); } catch (e) {}
      setPhase('paused');
    } else {
      startTimer();
      if (ambientSound) try { await ambientSound.playAsync(); } catch (e) {}
      setPhase('playing');
    }
  };

  const handleSkip = async (seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newElapsed = Math.max(0, Math.min(durationMs, elapsedRef.current + seconds * 1000));
    elapsedRef.current = newElapsed;
    setProgress(Math.min(newElapsed / durationMs, 1));
    setElapsed(Math.floor(newElapsed / 1000));

    if (newElapsed >= durationMs) {
      handleComplete();
    }
  };

  const handleExit = () => {
    Alert.alert("End session?", "You haven't completed the meditation.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End", style: "destructive", onPress: () => {
          updateMeditationSession(sessionId, { status: 'abandoned', endTime: Date.now() });
          router.back();
        }
      }
    ]);
  };

  const handleCompleteExit = () => {
    if (rating > 0 || feeling) {
      updateMeditationSession(sessionId, { rating, feeling: feeling || undefined });
    }
    router.back();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getBgColors = (): [string, string] => {
    switch (meditation.category) {
      case 'sleep': return ['#120820', '#060310'];
      case 'focus': return ['#0B1A22', '#040D14'];
      case 'stress': return ['#1A1010', '#100808'];
      case 'morning': return ['#1A1508', '#100C04'];
      default: return ['#0E1218', '#06090E'];
    }
  };

  // Background particles
  const particles = useRef(
    Array.from({ length: 30 }, () => ({
      cx: Math.random() * width,
      cy: Math.random() * (height + 200),
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.25 + 0.05,
    }))
  ).current;

  // ── Complete Screen ──
  if (phase === 'complete') {
    return (
      <View style={[styles.container, { backgroundColor: getBgColors()[1] }]}>
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>🙏</Text>
          <Text style={styles.completeTitle}>Namaste</Text>
          <Text style={styles.completeStats}>{lang === 'en' ? meditation.title : meditation.titleHi}</Text>
          <Text style={styles.completeMeta}>{meditation.duration} minutes · {meditation.category}</Text>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>How do you feel?</Text>
            <View style={styles.feelingRow}>
              {[
                { key: 'Calm', emoji: '😌' },
                { key: 'Focused', emoji: '🎯' },
                { key: 'Sleepy', emoji: '😴' },
                { key: 'Better', emoji: '✨' },
              ].map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.feelingPill, feeling === f.key && { backgroundColor: '#2D8B6F', borderColor: '#2D8B6F' }]}
                  onPress={() => setFeeling(f.key)}
                >
                  <Text style={styles.feelingEmoji}>{f.emoji}</Text>
                  <Text style={[styles.feelingText, feeling === f.key && { color: 'white' }]}>{f.key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons name={rating >= star ? 'star' : 'star-outline'} size={34} color={rating >= star ? '#F4A44A' : 'rgba(255,255,255,0.15)'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.returnBtn} onPress={handleCompleteExit}>
            <Text style={styles.returnBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Progress ring
  const ringRadius = 90;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - progress * ringCircumference;

  return (
    <View style={styles.container}>
      <LinearGradient colors={getBgColors()} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {/* Background particles */}
      <Animated.View style={[styles.particlesLayer, {
        transform: [{ translateY: particlesAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -120] }) }],
      }]}>
        <Svg height={height + 200} width={width}>
          {particles.map((p, i) => (
            <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="white" opacity={p.opacity} />
          ))}
        </Svg>
      </Animated.View>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={handleExit} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lang === 'en' ? meditation.title : meditation.titleHi}
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </Animated.View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {phase === 'loading' ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ rotate: rotation }, { scale: pulseAnim }] }}>
              <Svg height={180} width={180} viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Path
                    key={i}
                    d="M 50 20 Q 58 50 50 80 Q 42 50 50 20"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="0.5"
                    transform={`rotate(${i * 60} 50 50)`}
                  />
                ))}
              </Svg>
            </Animated.View>
            <Text style={styles.loadingText}>
              {lang === 'en' ? 'Preparing your space...' : 'आपका स्थान तैयार हो रहा है...'}
            </Text>
          </View>
        ) : (
          <>
            {/* Mandala with progress ring */}
            <View style={styles.mandalaContainer}>
              {/* Glow behind mandala */}
              <Animated.View style={[styles.mandalaGlow, {
                opacity: glowAnim,
                backgroundColor: getBgColors()[0] === '#120820' ? '#6C5CE7' : '#2D8B6F',
              }]} />

              <Animated.View style={{ transform: [{ rotate: rotation }, { scale: pulseAnim }] }}>
                <Svg height={width * 0.6} width={width * 0.6} viewBox="0 0 100 100">
                  <Defs>
                    <SvgGrad id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="rgba(255,255,255,0.5)" />
                      <Stop offset="1" stopColor="rgba(255,255,255,0.15)" />
                    </SvgGrad>
                  </Defs>

                  {/* Background ring */}
                  <Circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" fill="none" />

                  {/* Mandala petals */}
                  <Circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" />
                  <Circle cx="50" cy="50" r="15" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Path
                      key={i}
                      d="M 50 15 Q 58 35 50 55 Q 42 35 50 15"
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="0.4"
                      transform={`rotate(${i * 30} 50 50)`}
                    />
                  ))}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Path
                      key={`outer-${i}`}
                      d="M 50 8 Q 56 25 50 42 Q 44 25 50 8"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="0.3"
                      transform={`rotate(${i * 45 + 22.5} 50 50)`}
                    />
                  ))}

                  {/* Core dot */}
                  <Circle cx="50" cy="50" r="3" fill="rgba(255,255,255,0.2)" />
                </Svg>
              </Animated.View>

              {/* Progress ring overlay (non-rotating) */}
              <View style={styles.progressRingContainer}>
                <Svg height={width * 0.65} width={width * 0.65} viewBox="0 0 200 200">
                  <Circle
                    cx="100" cy="100" r={ringRadius}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin="100, 100"
                  />
                </Svg>
              </View>
            </View>

            {/* Script text */}
            <Animated.View style={[styles.scriptContainer, { opacity: scriptFadeAnim }]}>
              <Text style={styles.scriptText}>
                {scriptSegments[scriptIndex]}
              </Text>
            </Animated.View>

            {/* Time display */}
            <Text style={styles.timeDisplay}>
              {formatTime(elapsed)} / {formatTime(meditation.duration * 60)}
            </Text>

            {/* Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.skipBtn} onPress={() => handleSkip(-30)}>
                <Ionicons name="play-back" size={22} color="rgba(255,255,255,0.5)" />
                <Text style={styles.skipLabel}>30s</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
                <Ionicons
                  name={phase === 'playing' ? "pause" : "play"}
                  size={30}
                  color={getBgColors()[0]}
                  style={phase !== 'playing' ? { marginLeft: 3 } : undefined}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipBtn} onPress={() => handleSkip(30)}>
                <Ionicons name="play-forward" size={22} color="rgba(255,255,255,0.5)" />
                <Text style={styles.skipLabel}>30s</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  particlesLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const,

  header: {
    position: 'absolute', top: 50, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  headerTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },

  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  loadingContainer: { alignItems: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.4)', marginTop: 24, fontSize: 15, fontWeight: '500' },

  // Mandala area
  mandalaContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  mandalaGlow: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
  },
  progressRingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Script
  scriptContainer: { paddingHorizontal: 36, marginBottom: 16 },
  scriptText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '400',
  },

  // Time
  timeDisplay: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Controls
  controlsContainer: { flexDirection: 'row', alignItems: 'center', gap: 36 },
  skipBtn: { alignItems: 'center', gap: 2 },
  skipLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '600' },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },

  // Complete
  completeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  completeEmoji: { fontSize: 56, marginBottom: 12 },
  completeTitle: { fontSize: 28, fontWeight: '700', color: 'white', marginBottom: 6 },
  completeStats: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: '500' },
  completeMeta: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 },

  ratingSection: { alignItems: 'center', width: '100%' },
  ratingLabel: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 16, fontWeight: '500' },
  feelingRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' },
  feelingPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feelingEmoji: { fontSize: 16 },
  feelingText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 },
  starsRow: { flexDirection: 'row', gap: 10 },

  returnBtn: {
    marginTop: 32,
    backgroundColor: '#2D8B6F',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 20,
  },
  returnBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
