// jest.config.js
module.exports = {
  preset: 'jest-expo', // Use 'jest-expo' as it aligns with your project and includes React Native setup
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect', // Extend Jest matchers for React Native
    '<rootDir>/jest.setup.js', // Your custom setup file
  ],
  transformIgnorePatterns: [
    // This pattern tells Jest to ignore transforming most of node_modules,
    // but to *transform* specific React Native and Expo related packages.
    // core-js-pure should fall into the ignored category, thus not being transpiled by Babel.
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-reanimated|@expo-google-fonts)'
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['/e2e/'],
  // Consider adding `clearMocks: true` for cleaner tests
  // clearMocks: true,
};