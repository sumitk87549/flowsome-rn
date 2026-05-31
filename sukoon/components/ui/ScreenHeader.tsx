import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Props = {
  title: string;
  rightIcon?: React.ReactNode;
  showBack?: boolean;
  onRightPress?: () => void;
};

export const ScreenHeader = ({ title, rightIcon, showBack, onRightPress }: Props) => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {rightIcon && (
        <TouchableOpacity
          style={[styles.rightIconContainer, { backgroundColor: colors.glassSurface }]}
          activeOpacity={0.7}
          onPress={onRightPress}
        >
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    marginRight: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
