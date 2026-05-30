import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Animated, TouchableOpacity, Alert, 
  Platform, StatusBar, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { v4 as uuidv4 } from 'uuid';
import { useSessionStore } from '../../stores/sessionStore';
import { BREATHING_TECHNIQUES } from '../../constants/breathing';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function BreatheSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addBreathingSession } = useSessionStore();

  const techniqueId = params.id as string;
  const technique = BREATHING_TECHNIQUES.find(t => t.id === techniqueId) || BREATHING_TECHNIQUES[0];

  // Session State
  const [sessionId] = useState(() => uuidv4());
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(5); // Default to 5
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(technique.pattern[0]);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for logic
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartTimeRef = useRef(Date.now());
  const currentPhaseIndexRef = useRef(0);
  const currentRoundRef = useRef(1);

  // Animation Refs
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const colorAnim = useRef(new Animated.Value(0)).current; // 0: amber, 1: white, 2: teal
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    StatusBar.setHidden(true);
    
    // Start session
    startPhase(0, 1);

    return () => {
      StatusBar.setHidden(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getPhaseColorValue = (pIndex: number) => {
    const phaseType = technique.phases[pIndex];
    if (phaseType.includes('inhale')) return 0;
    if (phaseType.includes('exhale')) return 2;
    return 1; // Hold
  };

  const getPhaseScaleValue = (pIndex: number) => {
    const phaseType = technique.phases[pIndex];
    if (phaseType.includes('inhale')) return 1.0;
    if (phaseType.includes('exhale')) return 0.4;
    // For hold, keep current
    return pIndex > 0 ? getPhaseScaleValue(pIndex - 1) : 1.0;
  };

  const triggerPhaseAnimation = (pIndex: number, durationSec: number) => {
    const targetScale = getPhaseScaleValue(pIndex);
    const targetColor = getPhaseColorValue(pIndex);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: targetScale,
        duration: durationSec * 1000,
        useNativeDriver: false,
      }),
      Animated.timing(colorAnim, {
        toValue: targetColor,
        duration: durationSec * 1000 > 0 ? 500 : 0, // Quick color transition
        useNativeDriver: false,
      })
    ]).start();
  };

  const triggerHaptic = (pIndex: number) => {
    const phaseType = technique.phases[pIndex];
    if (phaseType.includes('inhale') || phaseType.includes('exhale')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const startPhase = (pIndex: number, round: number) => {
    // Skip 0-duration phases
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

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - phaseStartTimeRef.current) / 1000);
      const remaining = Math.max(0, technique.pattern[pIndex] - elapsed);
      setPhaseTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(timerRef.current!);
        handlePhaseEnd(pIndex, round);
      }
    }, 100); // 100ms interval for smooth UI update
  };

  const handlePhaseEnd = (pIndex: number, round: number) => {
    let nextIndex = pIndex + 1;
    let nextRound = round;

    if (nextIndex >= technique.pattern.length) {
      nextIndex = 0;
      nextRound += 1;
    }

    if (nextRound > totalRounds) {
      // Complete
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addBreathingSession({
        id: sessionId,
        techniqueId: technique.id,
        rounds: totalRounds,
        completedRounds: totalRounds,
        duration: totalRounds * technique.pattern.reduce((a,b)=>a+b, 0),
        startTime: Date.now(),
        timestamp: Date.now()
      });
    } else {
      startPhase(nextIndex, nextRound);
    }
  };

  const handleExit = () => {
    if (!isComplete) {
      Alert.alert("End session?", "Your progress won't be saved.", [
        { text: "Cancel", style: "cancel" },
        { text: "End", style: "destructive", onPress: () => router.back() }
      ]);
    } else {
      router.back();
    }
  };

  const getPhaseText = () => {
    const p = technique.phases[phaseIndex];
    if (p.includes('inhale')) return "Breathe in slowly...";
    if (p.includes('exhale')) return "Let it all go...";
    return "Hold gently...";
  };

  const getCircleColor = () => {
    return colorAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['rgba(244,164,74,0.8)', 'rgba(255,255,255,0.6)', 'rgba(77,184,150,0.8)']
    });
  };

  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>✨</Text>
          <Text style={styles.completeTitle}>Session Complete</Text>
          <Text style={styles.completeSub}>Your parasympathetic nervous system is now active</Text>
          <Text style={styles.scienceText}>{technique.science}</Text>
          
          <TouchableOpacity style={styles.returnBtn} onPress={() => router.back()}>
            <Text style={styles.returnBtnText}>Return</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
        <Ionicons name="close" size={32} color="white" />
      </TouchableOpacity>

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        
        <View style={styles.circleContainer}>
          {/* Outer Guide Ring */}
          <View style={[styles.guideRing, { width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4 }]} />
          
          <Svg height={width} width={width} style={styles.svg}>
            <AnimatedCircle 
              cx={width / 2} 
              cy={width / 2} 
              r={scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.4] })} 
              fill={getCircleColor()} 
            />
          </Svg>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.phaseLabel}>{getPhaseText()}</Text>
          <Text style={styles.countdown}>{phaseTimeLeft}</Text>
          <Text style={styles.roundInfo}>{technique.name} • Round {currentRound} of {totalRounds}</Text>
        </View>

        {/* Nadi Shodhana Special Guide */}
        {technique.id === 'nadi' && (
          <View style={styles.nadiContainer}>
            <Svg width="60" height="80" viewBox="0 0 60 80">
              {/* Simple nose outline */}
              <Path d="M30 10 L30 60" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeLinecap="round" />
              <Path d="M15 50 Q15 70 30 70 Q45 70 45 50" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" strokeLinecap="round" />
              
              {/* Left nostril highlight */}
              <Circle cx="22" cy="65" r="8" fill={technique.phases[phaseIndex] === 'inhale-left' ? '#F4A44A' : 'transparent'} />
              {/* Right nostril highlight */}
              <Circle cx="38" cy="65" r="8" fill={technique.phases[phaseIndex] === 'exhale-right' ? '#4DB896' : 'transparent'} />
            </Svg>
            <Text style={styles.nadiText}>
              {technique.phases[phaseIndex] === 'inhale-left' ? 'Close right nostril' : 'Close left nostril'}
            </Text>
          </View>
        )}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  exitBtn: { position: 'absolute', top: 50, right: 24, zIndex: 10 },
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  circleContainer: { width: width, height: width, alignItems: 'center', justifyContent: 'center' },
  guideRing: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  svg: { position: 'absolute' },

  textContainer: { alignItems: 'center', marginTop: 40 },
  phaseLabel: { fontSize: 28, color: 'white', fontWeight: '500', marginBottom: 12 },
  countdown: { fontSize: 48, color: 'white', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 24 },
  roundInfo: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  nadiContainer: { position: 'absolute', bottom: 80, alignItems: 'center' },
  nadiText: { color: 'rgba(255,255,255,0.8)', marginTop: 8, fontSize: 14 },

  completeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  completeEmoji: { fontSize: 64, marginBottom: 20 },
  completeTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  completeSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 24 },
  scienceText: { fontSize: 14, color: '#4DB896', textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20 },
  returnBtn: { marginTop: 60, backgroundColor: 'white', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 24 },
  returnBtnText: { fontSize: 18, fontWeight: 'bold', color: '#0A0E1A' },
});
