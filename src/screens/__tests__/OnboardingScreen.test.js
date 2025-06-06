import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import OnboardingScreen from '../OnboardingScreen';
import { AuthContext } from '../../context/AuthContext';
import { UserContext } from '../../context/UserContext';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'doc'),
  setDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../firebase/firebaseClient', () => ({
  auth: {},
  db: {},
}));

describe('OnboardingScreen', () => {
  const signInMock = jest.fn();
  const setUserProfileMock = jest.fn();

  const wrapper = ({ children }) => (
    <AuthContext.Provider value={{ signIn: signInMock }}>
      <UserContext.Provider value={{ setUserProfile: setUserProfileMock }}>
        {children}
      </UserContext.Provider>
    </AuthContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields', async () => {
    const { getByText, queryAllByText } = render(<OnboardingScreen />, { wrapper });

    fireEvent.press(getByText('Get Started'));

    expect(getByText('Invalid email address.')).toBeTruthy();
    expect(getByText('Password must be at least 6 characters.')).toBeTruthy();
    expect(queryAllByText('This field is required.').length).toBe(2);
  });

  it('updates selected avatar when pressed', () => {
    const { getByA11yLabel } = render(<OnboardingScreen />, { wrapper });

    const avatar = getByA11yLabel('Avatar 1');
    fireEvent.press(avatar);

    expect(getByA11yLabel('Avatar 1')).toHaveAccessibilityState({ selected: true });
  });

  it('creates a user and signs in on success', async () => {
    const { createUserWithEmailAndPassword } = require('firebase/auth');
    const { setDoc } = require('firebase/firestore');

    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } });

    const { getByA11yLabel, getByText, queryByType } = render(<OnboardingScreen />, { wrapper });

    fireEvent.changeText(getByA11yLabel('email'), 'test@example.com');
    fireEvent.changeText(getByA11yLabel('password'), '123456');
    fireEvent.changeText(getByA11yLabel('username'), 'tester');
    fireEvent.press(getByText('Strength'));

    fireEvent.press(getByText('Get Started'));

    expect(queryByType(ActivityIndicator)).toBeTruthy();

    await waitFor(() => expect(createUserWithEmailAndPassword).toHaveBeenCalled());

    expect(setDoc).toHaveBeenCalled();
    expect(setUserProfileMock).toHaveBeenCalled();
    expect(signInMock).toHaveBeenCalled();
    expect(queryByType(ActivityIndicator)).toBeNull();
  });

  it('shows error message when signup fails', async () => {
    const { createUserWithEmailAndPassword } = require('firebase/auth');
    createUserWithEmailAndPassword.mockRejectedValue(new Error('Creation failed'));

    const { getByA11yLabel, getByText, queryByText } = render(<OnboardingScreen />, { wrapper });

    fireEvent.changeText(getByA11yLabel('email'), 'test@example.com');
    fireEvent.changeText(getByA11yLabel('password'), '123456');
    fireEvent.changeText(getByA11yLabel('username'), 'tester');
    fireEvent.press(getByText('Strength'));

    fireEvent.press(getByText('Get Started'));

    await waitFor(() => expect(createUserWithEmailAndPassword).toHaveBeenCalled());

    expect(queryByText('Creation failed')).toBeTruthy();
  });
});
