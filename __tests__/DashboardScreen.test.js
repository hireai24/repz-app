import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../src/screens/DashboardScreen';
import { XPContext } from '../src/context/XPContext';
import { UserContext } from '../src/context/UserContext';
import * as streakHook from '../src/hooks/useStreakTracker';
import * as userApi from '../src/api/userApi';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

jest.mock('../src/hooks/useStreakTracker');
jest.mock('../src/api/userApi');
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

describe('DashboardScreen', () => {
  const wrapper = (ui, xpProps = {}, userProps = {}) => {
    const xp = {
      xp: 150,
      level: 2,
      xpToNext: 200,
      addXP: jest.fn(),
      applyStreakBonus: jest.fn(),
      ...xpProps,
    };
    const user = {
      userId: 'user123',
      userProfile: { username: 'Test', tier: 'Free' },
      ...userProps,
    };

    return render(
      <XPContext.Provider value={xp}>
        <UserContext.Provider value={user}>{ui}</UserContext.Provider>
      </XPContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads XP and streak from context', async () => {
    streakHook.default.mockReturnValue({ streak: 5 });
    userApi.getUserPlans.mockResolvedValue({ success: true, plans: [] });
    getDoc.mockResolvedValue({ exists: () => false });

    const { getByA11yLabel } = wrapper(<DashboardScreen />);

    expect(streakHook.default).toHaveBeenCalledWith('user123');
    await waitFor(() => {
      expect(getByA11yLabel('XP progress: 150 out of 200')).toBeTruthy();
    });
  });

  test('renders daily workout card', async () => {
    streakHook.default.mockReturnValue({ streak: 0 });
    userApi.getUserPlans.mockResolvedValue({ success: true, plans: [] });
    const challenge = { title: 'Pushups', xp: 50 };
    getDoc.mockResolvedValue({ exists: () => true, data: () => challenge });

    const { findByText } = wrapper(<DashboardScreen />);

    expect(await findByText('Pushups')).toBeTruthy();
  });

  test('joins daily challenge', async () => {
    streakHook.default.mockReturnValue({ streak: 0 });
    userApi.getUserPlans.mockResolvedValue({ success: true, plans: [] });
    const challenge = { title: 'Pushups', xp: 50, completed: false };
    getDoc.mockResolvedValue({ exists: () => true, data: () => challenge });

    const addXP = jest.fn();
    const { findByText } = wrapper(<DashboardScreen />, { addXP });

    const button = await findByText('Submit');
    fireEvent.press(button);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(addXP).toHaveBeenCalledWith(50);
    });
  });

  test('shows error when plans fail to load', async () => {
    streakHook.default.mockReturnValue({ streak: 0 });
    userApi.getUserPlans.mockResolvedValue({ success: false });
    getDoc.mockResolvedValue({ exists: () => false });

    const { findByText } = wrapper(<DashboardScreen />);

    expect(await findByText('dashboard.errorLoadingPlans')).toBeTruthy();
  });
});
