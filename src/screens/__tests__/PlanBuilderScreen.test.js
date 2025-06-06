import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PlanBuilderScreen from '../PlanBuilderScreen';
import { UserContext } from '../../context/UserContext';
import { useTierAccess } from '../../hooks/useTierAccess';
import useFadeIn from '../../animations/fadeIn';
import { generateWorkoutPlan } from '../../api/workoutApi';
import { Alert } from 'react-native';

jest.mock('../../hooks/useTierAccess');
jest.mock('../../animations/fadeIn');
jest.mock('../../api/workoutApi');

const renderWithContext = (ui, { userProfile = {}, userId = '1' } = {}) => {
  const Wrapper = ({ children }) => (
    <UserContext.Provider value={{ userProfile, userId }}>{children}</UserContext.Provider>
  );
  return render(ui, { wrapper: Wrapper });
};

beforeEach(() => {
  useTierAccess.mockReturnValue({ locked: false });
  useFadeIn.mockReturnValue(1);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  generateWorkoutPlan.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('generates a plan with valid input', async () => {
  const mockPlan = [{ day: 'Day 1', exercises: [{ name: 'Pushups', details: '3x10' }] }];
  generateWorkoutPlan.mockResolvedValue({ success: true, plan: mockPlan });

  const { getByText } = renderWithContext(<PlanBuilderScreen />, {
    userProfile: { equipment: [], injuries: [], experience: 'Intermediate' },
    userId: 'user1',
  });

  fireEvent.press(getByText('Fat Loss'));
  fireEvent.press(getByText('Push/Pull/Legs'));
  fireEvent.press(getByText('4 plan.daysShort'));
  fireEvent.press(getByText('plan.generate').parent);

  await waitFor(() => expect(generateWorkoutPlan).toHaveBeenCalled());
  expect(getByText('Day 1')).toBeTruthy();
});

test('shows alert if required input missing', async () => {
  const { getByText } = renderWithContext(<PlanBuilderScreen />);

  fireEvent.press(getByText('plan.generate').parent);

  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  expect(generateWorkoutPlan).not.toHaveBeenCalled();
});

test('displays loading and error states', async () => {
  generateWorkoutPlan.mockResolvedValue({ success: false, error: 'api fail' });

  const { getByText, queryByText } = renderWithContext(<PlanBuilderScreen />);

  fireEvent.press(getByText('Fat Loss'));
  fireEvent.press(getByText('Push/Pull/Legs'));
  fireEvent.press(getByText('4 plan.daysShort'));
  fireEvent.press(getByText('plan.generate').parent);

  expect(queryByText('plan.generate')).toBeNull();
  await waitFor(() => expect(getByText('api fail')).toBeTruthy());
});
