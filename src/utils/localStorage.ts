/**
 * localStorage utility functions for dashboard state persistence
 * Provides safe access to localStorage with error handling
 */

/**
 * Saves state to localStorage
 * @param key - Storage key
 * @param value - Value to save (will be JSON stringified)
 * @returns boolean - Success status
 */
export const saveState = <T>(key: string, value: T): boolean => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.error('[localStorage] Quota exceeded - storage is full');
      } else {
        console.error('[localStorage] Failed to save state:', error.message);
      }
    }
    return false;
  }
};

/**
 * Loads state from localStorage
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns Parsed state or default value
 */
export const loadState = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[localStorage] Failed to load state:', error.message);
    }
    return defaultValue;
  }
};

/**
 * Removes specific key from localStorage
 * @param key - Storage key to remove
 */
export const clearState = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    if (error instanceof Error) {
      console.error('[localStorage] Failed to clear state:', error.message);
    }
  }
};

/**
 * Clears all dashboard-related state from localStorage
 * Removes all keys that start with 'austlift-'
 */
export const clearAllState = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('austlift-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[localStorage] Failed to clear all state:', error.message);
    }
  }
};

/**
 * Checks if localStorage is available
 * @returns boolean - True if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets the size of stored data in bytes
 * @param key - Storage key
 * @returns number - Size in bytes, or 0 if key doesn't exist
 */
export const getStateSize = (key: string): number => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return 0;
    }
    return new Blob([serialized]).size;
  } catch {
    return 0;
  }
};
