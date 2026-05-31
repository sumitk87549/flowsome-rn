import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Alert,
  Platform, StatusBar, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { generateId } from '../../utils/id';
import { useSessionStore } from '../../stores/sessionStore';
import { useUserStore } from '../../stores/userStore';
import { BREATHING_TECHNIQUES } from '../../constants/breathing';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

let breathingAudio: any = null;
try { breathingAudio = require('../../utils/breathingAudio').breathingAudio; } catch (_) {}

export default function BreatheSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addBreathingSession } = useSessionStore();
  const { updateStreakFromSession } = useUserStore();

  const techniqueId = params.id as string;
  const technique = BREATHING_TECHNIQUES.find(t => t.id === techniqueId) || BREATHING_TECHNIQUES[0];

  // Session State
  const [sessionId] = useState(() => generateId());
  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(5);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(technique.pattern[0]);
  const [isComplete, setIsComplete] = useState(false);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseStartTimeRef = useRef(Date.now());
  const currentPhaseIndexRef = useRef(0);
  const currentRoundRef = useRef(1);

  // Animation Refs
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const introOpacity = useRef(new Animated.Value(1)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.9)).current;
  const bgParticles = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    StatusBar.setHidden(true);

    // Load breathing audio
    if (breathingAudio) {
      breathingAudio.loadSounds().then(() => {
        breathingAudio.startAmbient();
      });
    }

    // Background particle animation
    Animated.loop(
      Animated.timing(bgParticles, { toValue: 1, duration: 30000, useNativeDriver: true })
    ).start();

    // Start intro phase
    setTimeout(() => {
      Animated.timing(introOpacity, { toValue: 0, duration: 800, useNativeDriver: true }).start(() => {
        setPhase('active');
        startPhase(0, 1);
      });
    }, 3000);

    return () => {
      StatusBar.setHidden(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathingAudio) breathingAudio.unloadAll();
    };
  }, []);

  const getPhaseScaleValue = (pIndex: number): number => {
    const phaseType = technique.phases[pIndex];
    if (phaseType.includes('inhale')) return 1.0;
    if (phaseType.includes('exhale') || phaseType.includes('hum')) return 0.35;
    return pIndex > 0 ? getPhaseScaleValue(pIndex - 1) : 1.0;
  };

  const getPhaseColorValue = (pIndex: number) => {
    const phaseType = technique.phases[pIndex];
    if (phaseType.includes('inhale')) return 0;
    if (phaseType.includes('exhale') || phaseType.includes('hum')) return 2;
    return 1;
  };

  const triggerPhaseAnimation = (pIndex: number, durationSec: number) => {
    const targetScale = getPhaseScaleValue(pIndex);
    const targetColor = getPhaseColorValue(pIndex);
    const phaseType = technique.phases[pIndex];

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: targetScale,
        duration: durationSec * 1000,
        useNativeDriver: false,
      }),
      Animated.timing(colorAnim, {
        toValue: targetColor,
        duration: 500,
        useNativeDriver: false,
      }),
      // Text animation
      Animated.sequence([
        Animated.timing(textScale, { toValue: 1.05, duration: 300, useNativeDriver: true }),
        Animated.timing(textScale, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // Glow on inhale
    if (phaseType.includes('inhale')) {
      Animated.timing(glowOpacity, { toValue: 0.7, duration: durationSec * 1000, useNativeDriver: true }).start();
      triggerRipples();
    } else if (phaseType.includes('exhale') || phaseType.includes('hum')) {
      Animated.timing(glowOpacity, { toValue: 0.2, duration: durationSec * 1000, useNativeDriver: true }).start();
    }
  };

  const triggerRipples = () => {
    [ripple1, ripple2, ripple3].forEach((ripple, i) => {
      setTimeout(() => {
        ripple.setValue(0);
        Animated.timing(ripple, { toValue: 1, duration: 2000, useNativeDriver: true }).start();
      }, i * 400);
    });
  };

  const triggerHaptic = (pIndex: number) => {
    const phaseType = technique.phases[pIndex];
    if (phaseType.includes('inhale') || phaseType.includes('exhale') || phaseType.includes('hum')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (phaseType) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const startPhase = (pIndex: number, round: number) => {
    if (technique.pattern[pIndex] === 0) {
      handlePhaseEnd(pIndex, round);
      return;
    }

    currentPhaseIndexRef.current = pIndex;
    currentRoundRef.current = round;

    setPhaseIndex(pIndex);
    setCurrentRound(round);
    setPhaseTimeLeft(technique.pattern[pIndex]);

    phaseStartTimeRef.current = Date.now();

    triggerHaptic(pIndex);
    triggerPhaseAnimation(pIndex, technique.pattern[pIndex]);

    // Play phase sound
    if (breathingAudio) {
      breathingAudio.playPhaseSound(technique.phases[pIndex]);
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - phaseStartTimeRef.current) / 1000);
      const remaining = Math.max(0, technique.pattern[pIndex] - elapsed);
      setPhaseTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timerRef.current!);
        handlePhaseEnd(pIndex, round);
      }
    }, 100);
  };

  const handlePhaseEnd = (pIndex: number, round: number) => {
    let nextIndex = pIndex + 1;
    let nextRound = round;

    if (nextIndex >= technique.pattern.length) {
      nextIndex = 0;
      nextRound += 1;
    }

    if (nextRound > totalRounds) {
      setIsComplete(true);
      setPhase('complete');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (breathingAudio) breathingAudio.stopAmbient();
      addBreathingSession({
        id: sessionId,
        type: 'breathe',
        techniqueId: technique.id,
        rounds: totalRounds,
        completedRounds: totalRounds,
        duration: totalRounds * technique.pattern.reduce((a, b) => a + b, 0),
        startTime: Date.now(),
        timestamp: Date.now()
      });
      updateStreakFromSession();
    } else {
      startPhase(nextIndex, nextRound);
    }
  };

  const handleExit = () => {
    if (isComplete) {
      router.back();
      return;
    }
    Alert.alert("End session?", "Your progress won't be saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "End", style: "destructive", onPress: () => router.back() }
    ]);
  };

  const getPhaseText = () => {
    const p = technique.phases[phaseIndex];
    if (p.includes('inhale')) return "Breathe in...";
    if (p.includes('exhale') || p.includes('hum')) return "Let it go...";
    if (p.includes('hold') || p === 'hold') return "Hold gently...";
    return "Hold...";
  };

  const getCircleColor = () => {
    return colorAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [`${technique.color}CC`, 'rgba(255,255,255,0.4)', `${technique.color}66`]
    });
  };

  const renderRipple = (rippleAnim: Animated.Value, delay: number) => {
    const rippleScale = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] });
    const rippleOpacity = rippleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.15, 0] });
    return (
      <Animated.View
        key={delay}
        style={[styles.rippleRing, {
          width: width * 0.8,
          height: width * 0.8,
          borderRadius: width * 0.4,
          borderColor: technique.color,
          opacity: rippleOpacity,
          transform: [{ scale: rippleScale }],
        }]}
      />
    );
  };

  // Background particles
  const particles = useRef(
    Array.from({ length: 25 }, () => ({
      cx: Math.random() * width,
      cy: Math.random() * width * 1.8,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.3 + 0.05,
    }))
  ).current;

  // ── Intro Screen ──
  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.introContent, { opacity: introOpacity }]}>
          <Text style={styles.introEmoji}>🌿</Text>
          <Text style={styles.introTitle}>{technique.name}</Text>
          <Text style={styles.introPattern}>{technique.pattern.join(' · ')}</Text>
          <Text style={styles.introMessage}>Get comfortable...{'\n'}We'll begin shortly</Text>
        </Animated.View>
      </View>
    );
  }

  // ── Complete Screen ──
  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>✨</Text>
          <Text style={styles.completeTitle}>Session Complete</Text>
          <Text style={styles.completeSub}>{technique.name} · {totalRounds} rounds</Text>

          <View style={[styles.scienceCard, { backgroundColor: `${technique.color}15` }]}>
            <Text style={[styles.scienceLabel, { color: technique.color }]}>💡 Did you know?</Text>
            <Text style={[styles.scienceText, { color: 'rgba(255,255,255,0.7)' }]}>{technique.science}</Text>
          </View>

          <TouchableOpacity style={[styles.returnBtn, { backgroundColor: technique.color }]} onPress={() => router.back()}>
            <Text style={styles.returnBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Active Session ──
  return (
    <View style={styles.container}>
      {/* Background particles */}
      <Animated.View style={[styles.particlesLayer, {
        transform: [{ translateY: bgParticles.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) }],
      }]}>
        <Svg height={width * 2} width={width}>
          {particles.map((p, i) => (
            <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="white" opacity={p.opacity} />
          ))}
        </Svg>
      </Animated.View>

      {/* Exit button */}
      <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
        <View style={styles.exitBtnInner}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>

        <View style={styles.circleContainer}>
          {/* Ripple rings */}
          {renderRipple(ripple1, 0)}
          {renderRipple(ripple2, 1)}
          {renderRipple(ripple3, 2)}

          {/* Outer guide ring */}
          <View style={[styles.guideRing, {
            width: width * 0.75,
            height: width * 0.75,
            borderRadius: width * 0.375,
            borderColor: `${technique.color}20`,
          }]} />

          {/* Glow behind circle */}
          <Animated.View style={[styles.glowCircle, {
            width: width * 0.6,
            height: width * 0.6,
            borderRadius: width * 0.3,
            backgroundColor: technique.color,
            opacity: glowOpacity,
          }]} />

          {/* Main breathing circle */}
          <Svg height={width} width={width} style={styles.svg}>
            <AnimatedCircle
              cx={width / 2}
              cy={width / 2}
              r={scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.35] })}
              fill={getCircleColor()}
            />
          </Svg>
        </View>

        {/* Phase text + countdown */}
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.phaseLabel, { transform: [{ scale: textScale }] }]}>
            {getPhaseText()}
          </Animated.Text>
          <Text style={styles.countdown}>{phaseTimeLeft}</Text>
          <Text style={styles.roundInfo}>{technique.name} · Round {currentRound} of {totalRounds}</Text>
        </View>

        {/* Nadi Shodhana Special Guide */}
        {technique.id === 'nadi' && (
          <View style={styles.nadiContainer}>
            <Svg width="60" height="80" viewBox="0 0 60 80">
              <Path d="M30 10 L30 60" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeLinecap="round" />
              <Path d="M15 50 Q15 70 30 70 Q45 70 45 50" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" strokeLinecap="round" />
              <Circle cx="22" cy="65" r="8" fill={technique.phases[phaseIndex] === 'inhale-left' ? technique.color : 'transparent'} />
              <Circle cx="38" cy="65" r="8" fill={technique.phases[phaseIndex] === 'exhale-right' ? technique.color : 'transparent'} />
            </Svg>
            <Text style={styles.nadiText}>
              {technique.phases[phaseIndex] === 'inhale-left' ? 'Close right nostril' : 'Close left nostril'}
            </Text>
          </View>
        )}

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {Array.from({ length: totalRounds }).map((_, i) => (
            <View key={i} style={[
              styles.progressDot,
              {
                backgroundColor: i < currentRound - 1
                  ? technique.color
                  : i === currentRound - 1
                  ? 'rgba(255,255,255,0.6)'
                  : 'rgba(255,255,255,0.15)',
              }
            ]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' } as const,
  particlesLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const,
  exitBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  exitBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Circle area
  circleContainer: { width: width, height: width, alignItems: 'center', justifyContent: 'center' },
  guideRing: { position: 'absolute', borderWidth: 1 },
  glowCircle: { position: 'absolute', opacity: 0.15 },
  svg: { position: 'absolute' },
  rippleRing: {
    position: 'absolute',
    borderWidth: 1,
  },

  // Text
  textContainer: { alignItems: 'center', marginTop: 24 },
  phaseLabel: { fontSize: 24, color: 'white', fontWeight: '500', marginBottom: 8 },
  countdown: {
    fontSize: 44,
    color: 'white',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
  },
  roundInfo: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  // Nadi
  nadiContainer: { position: 'absolute', bottom: 80, alignItems: 'center' },
  nadiText: { color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: 13, fontWeight: '500' },

  // Progress dots
  progressDots: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: { width: 8, height: 8, borderRadius: 4 },

  // Intro
  introContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  introEmoji: { fontSize: 48, marginBottom: 16 },
  introTitle: { fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 6 },
  introPattern: { fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 2, marginBottom: 24 },
  introMessage: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 24 },

  // Complete
  completeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  completeEmoji: { fontSize: 56, marginBottom: 16 },
  completeTitle: { fontSize: 26, fontWeight: '700', color: 'white', marginBottom: 6 },
  completeSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontWeight: '500' },
  scienceCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    width: '100%',
  },
  scienceLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  scienceText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  returnBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 20,
  },
  returnBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
