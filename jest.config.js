module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo)/)'
  ],
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|expo|@expo|react-native-reanimated|@expo-google-fonts)/'
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
