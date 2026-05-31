import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'surfaceAlt' | 'glass' | 'glow';
};

export const Card = ({ children, style, onPress, variant = 'default' }: CardProps) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'surfaceAlt':
        return { backgroundColor: colors.surfaceAlt };
      case 'glass':
        return {
          backgroundColor: colors.glassSurface,
          borderWidth: 1,
          borderColor: colors.glassStroke,
        };
      case 'glow':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.glassStroke,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 4,
        };
      default:
        return { backgroundColor: colors.surface };
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const cardStyle = [
    styles.card,
    getVariantStyle(),
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[cardStyle, { transform: [{ scale: scaleAnim }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
