/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import { login } from '../src/services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('handles non-json login responses gracefully', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: async () => '<html><body>Internal Server Error</body></html>',
    headers: {
      get: jest.fn(() => 'text/html'),
    },
  } as any);

  await expect(
    login({ identifier: 'demo@example.com', password: 'secret' })
  ).rejects.toMatchObject({
    message: expect.stringContaining('Unexpected response'),
  });
});
