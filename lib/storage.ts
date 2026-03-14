/**
 * Simple storage abstraction to work across Web (localStorage) and Mobile (Expo/AsyncStorage).
 * For Expo, you should later replace the placeholder with @react-native-async-storage/async-storage.
 */

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    // For Expo: Implement AsyncStorage.getItem(key) here
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
    // For Expo: Implement AsyncStorage.setItem(key, value) here
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
    // For Expo: Implement AsyncStorage.removeItem(key) here
  },
};
