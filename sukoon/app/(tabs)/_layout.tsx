import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { View, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav_home'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: t('nav_focus'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'timer' : 'timer-outline'} size={22} color={color} />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="breathe"
        options={{
          title: t('nav_breathe'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={22} color={color} />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="meditate"
        options={{
          title: t('nav_meditate'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'moon' : 'moon-outline'} size={22} color={color} />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: t('nav_garden'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'flower' : 'flower-outline'} size={22} color={color} />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 28,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
