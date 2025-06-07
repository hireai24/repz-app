// jest.setup.js
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  // Ensuring `call` exists on the mock, which is a good practice for older Reanimated versions
  // You might not need this line `Reanimated.default.call = () => {};` with newer Reanimated/Jest configs
  Reanimated.default.call = () => {};
  return Reanimated;
});

// This line is often no longer needed or causes issues with newer React Native versions
// as `react-native-reanimated/mock` often handles the Animated module's dependencies.
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');