import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useAppStore } from '../stores/appStore';
import { Colors } from '../constants/colors';

export const useTheme = () => {
  const storeScheme = useAppStore((state) => state.colorScheme);
  const nativeScheme = useNativeColorScheme();
  
  const isDark = storeScheme === 'system' ? nativeScheme === 'dark' : storeScheme === 'dark';
  
  return {
    colors: isDark ? Colors.dark : Colors.light,
    isDark,
  };
};
