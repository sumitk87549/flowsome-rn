import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const isLowEndDevice = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS devices are generally powerful enough, but we could check for very old models
    return false;
  }
  
  if (Platform.OS === 'android') {
    try {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const totalMemoryGB = totalMemory / (1024 * 1024 * 1024);
      
      // Consider devices with less than 3GB RAM as low-end
      if (totalMemoryGB < 3) {
        return true;
      }
      
      // Also consider devices on Android 9 or older as low-end
      const apiLevel = await DeviceInfo.getApiLevel();
      if (apiLevel < 29) { // API 28 is Android 9
        return true;
      }
      
      return false;
    } catch (e) {
      // Fallback to conservative approach if detection fails
      return parseInt(Platform.Version.toString(), 10) < 29;
    }
  }
  
  return false;
};
