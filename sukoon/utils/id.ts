/**
 * Generates a unique ID without requiring crypto.getRandomValues()
 * Safe for use in React Native / Hermes without any polyfill.
 */
export const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}-${randomPart2}`;
};
