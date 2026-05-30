import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert, Platform, StatusBar, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSessionStore } from '../../stores/sessionStore';
import { MEDITATIONS } from '../../constants/meditations';
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from '../../stores/userStore';

const { width, height } = Dimensions.get('window');

// ─── Safe wrappers for expo-av ─────────────────────────────────────────────
let Audio: any = null;
try { Audio = require('expo-av').Audio; } catch (_) {}

// ─── Helper function to safely load sound ──────────────────────────────────
const createSound = async (uri: string) => {
  if (!Audio) return null;
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false }
    );
    return sound;
  } catch (e) {
    console.warn("Audio loading failed", e);
    return null;
  }
};

export default function MeditateSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const meditationId = params.id as string;
  const lang = (params.lang as string) || 'en';
  
  const meditation = MEDITATIONS.find(m => m.id === meditationId) || MEDITATIONS[0];
  const { addMeditationSession, updateMeditationSession } = useSessionStore();
  const { updateStreakFromSession } = useUserStore();

  // ── State ──
  const [sessionId] = useState(() => uuidv4());
  const [phase, setPhase] = useState<'loading' | 'playing' | 'paused' | 'complete'>('loading');
  const [progress, setProgress] = useState(0); // 0 to 1
  const [soundObject, setSoundObject] = useState<any>(null);
  const [chimeSound, setChimeSound] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [scriptVisible, setScriptVisible] = useState(true);

  // ── Refs ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const durationMs = meditation.duration * 60 * 1000;

  // ── Animations ──
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; // Header fade
  const scriptFadeAnim = useRef(new Animated.Value(1)).current;

  // Initialize
  useEffect(() => {
    StatusBar.setHidden(true);

    // Initial log
    addMeditationSession({
      id: sessionId,
      type: 'meditate',
      meditationId: meditation.id,
      duration: meditation.duration,
      startTime: Date.now(),
      status: 'in-progress'
    });

    // Start background animations
    startMandalaAnimations();
    Animated.timing(fadeAnim, { toValue: 1, duration: 3000, useNativeDriver: true }).start(); // Fade in header slowly

    // Load audio
    const setupAudio = async () => {
      // In a real app we'd load the proper URL based on lang.
      // Since it's a CLOUDINARY_URL placeholder, it will fail gracefully or we just fake it if we're in Expo Go
      const url = lang === 'en' ? meditation.audioUrlEn : meditation.audioUrlHi;
      const sound = await createSound(url);
      setSoundObject(sound);
      
      const chime = await createSound('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3');
      setChimeSound(chime);

      // Simulate a small loading delay for immersion
      setTimeout(() => {
        setPhase('playing');
        startTimeRef.current = Date.now();
        startTimer();
        if (sound) {
          try { sound.playAsync(); } catch(e) {}
        }
      }, 2000);
    };

    setupAudio();

    return () => {
      StatusBar.setHidden(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundObject) try { soundObject.unloadAsync(); } catch(e) {}
      if (chimeSound) try { chimeSound.unloadAsync(); } catch(e) {}
    };
  }, []);

  // Update script chunk
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(scriptFadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(scriptFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true })
      ]).start();
    }, 30000);
    return () => clearInterval(interval);
  }, [phase]);

  const startMandalaAnimations = () => {
    // Very slow rotation: 60 seconds
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 60000, useNativeDriver: true })
    ).start();

    // Gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.95, duration: 4000, useNativeDriver: true })
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

      if (newElapsed >= durationMs) {
        handleComplete();
      }
    }, 1000);
  };

  const handleComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (soundObject) try { await soundObject.stopAsync(); } catch(e) {}
    if (chimeSound) try { await chimeSound.playAsync(); } catch(e) {}
    
    setPhase('complete');
    updateMeditationSession(sessionId, { status: 'completed', endTime: Date.now() });
    updateStreakFromSession();
  };

  const handlePlayPause = async () => {
    if (phase === 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundObject) try { await soundObject.pauseAsync(); } catch(e) {}
      setPhase('paused');
    } else {
      startTimer();
      if (soundObject) try { await soundObject.playAsync(); } catch(e) {}
      setPhase('playing');
    }
  };

  const handleExit = () => {
    Alert.alert("End session?", "You haven't completed the meditation.", [
      { text: "Cancel", style: "cancel" },
      { text: "End", style: "destructive", onPress: () => {
        updateMeditationSession(sessionId, { status: 'abandoned', endTime: Date.now() });
        router.back();
      }}
    ]);
  };

  const handleCompleteExit = () => {
    if (rating > 0 || feeling) {
      updateMeditationSession(sessionId, { rating, feeling: feeling || undefined });
    }
    router.back();
  };

  const getBgColors = () => {
    switch (meditation.category) {
      case 'sleep': return ['#1A0B2E', '#0A0412'];
      case 'focus': return ['#0B222E', '#041016'];
      case 'stress': return ['#2E1B1B', '#160A0A'];
      case 'morning': return ['#2E220B', '#161004'];
      default: return ['#1A222E', '#0A0E16'];
    }
  };

  if (phase === 'complete') {
    return (
      <View style={[styles.container, { backgroundColor: getBgColors()[1] }]}>
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>🙏</Text>
          <Text style={styles.completeTitle}>Namaste</Text>
          <Text style={styles.completeStats}>{meditation.title}</Text>
          <Text style={styles.completeStats}>{meditation.duration} minutes • {meditation.category}</Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>How do you feel now?</Text>
            
            <View style={styles.feelingRow}>
              {['Better', 'Same', 'Different'].map(f => (
                <TouchableOpacity 
                  key={f} 
                  style={[styles.feelingPill, feeling === f && { backgroundColor: '#2D8B6F', borderColor: '#2D8B6F' }]}
                  onPress={() => setFeeling(f)}
                >
                  <Text style={[styles.feelingText, feeling === f && { color: 'white' }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons name={rating >= star ? 'star' : 'star-outline'} size={40} color={rating >= star ? '#F4A44A' : 'rgba(255,255,255,0.3)'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.returnBtn} onPress={handleCompleteExit}>
            <Text style={styles.returnBtnText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={getBgColors() as [string, string]} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={handleExit} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{lang === 'en' ? meditation.title : meditation.titleHi}</Text>
          <Text style={styles.headerSub}>{lang.toUpperCase()}</Text>
        </View>
        <View style={{ width: 28 }} />
      </Animated.View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {phase === 'loading' ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="moon" size={48} color="rgba(255,255,255,0.5)" />
            <Text style={styles.loadingText}>{lang === 'en' ? 'Preparing your session...' : 'सत्र तैयार हो रहा है...'}</Text>
          </View>
        ) : (
          <>
            {/* Mandala */}
            <Animated.View style={{ transform: [{ rotate: rotation }, { scale: pulseAnim }] }}>
              <Svg height={width * 0.8} width={width * 0.8} viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
                <Circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" fill="none" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <Path
                    key={i}
                    d="M 50 20 Q 60 50 50 80 Q 40 50 50 20"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="0.5"
                    transform={`rotate(${i * 45} 50 50)`}
                  />
                ))}
              </Svg>
            </Animated.View>

            {/* Script Display */}
            <Animated.View style={[styles.scriptContainer, { opacity: scriptFadeAnim }]}>
              <Text style={styles.scriptText}>{meditation.script_preview}</Text>
            </Animated.View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.controlBtn}>
                <Ionicons name="play-back" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
                <Ionicons name={phase === 'playing' ? "pause" : "play"} size={32} color="#1A0B2E" style={{ marginLeft: phase === 'playing' ? 0 : 4 }} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn}>
                <Ionicons name="play-forward" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Progress Bar */}
      {phase !== 'loading' && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: {
    position: 'absolute', top: 50, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, zIndex: 10,
  },
  backBtn: { padding: 8 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2, letterSpacing: 1 },
  
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingContainer: { alignItems: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 20, fontSize: 16 },
  
  scriptContainer: { position: 'absolute', bottom: 160, paddingHorizontal: 40 },
  scriptText: { color: 'rgba(255,255,255,0.8)', fontSize: 18, textAlign: 'center', lineHeight: 28, fontStyle: 'italic' },
  
  controlsContainer: { position: 'absolute', bottom: 60, flexDirection: 'row', alignItems: 'center', gap: 40 },
  controlBtn: { padding: 12 },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  
  progressContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressBar: { height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' },
  
  completeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  completeEmoji: { fontSize: 80, marginBottom: 20 },
  completeTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  completeStats: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  ratingContainer: { marginTop: 40, alignItems: 'center' },
  ratingLabel: { fontSize: 16, color: 'white', marginBottom: 16 },
  feelingRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  feelingPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  feelingText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  starsRow: { flexDirection: 'row', gap: 12 },
  returnBtn: { marginTop: 60, backgroundColor: 'white', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16 },
  returnBtnText: { fontSize: 18, fontWeight: 'bold', color: '#1A0B2E' },
});
