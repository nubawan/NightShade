import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock native modules and services that depend on native code
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const { View } = require('react-native');
  return (props: any) => <View {...props} />;
});

jest.mock('../src/services/OverlayService', () => ({
  overlayService: {
    hasPermission: jest.fn(() => Promise.resolve(true)),
    requestPermission: jest.fn(() => Promise.resolve()),
    enable: jest.fn(() => Promise.resolve()),
    disable: jest.fn(() => Promise.resolve()),
    toggle: jest.fn(() => Promise.resolve(false)),
    isEnabled: jest.fn(() => Promise.resolve(false)),
    setOpacity: jest.fn(() => Promise.resolve()),
    setColor: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    setBrightness: jest.fn(() => Promise.resolve()),
    brightnessUp: jest.fn(() => Promise.resolve()),
    brightnessDown: jest.fn(() => Promise.resolve()),
    emergencyReset: jest.fn(() => Promise.resolve()),
    startService: jest.fn(() => Promise.resolve()),
    stopService: jest.fn(() => Promise.resolve()),
    showBubble: jest.fn(() => Promise.resolve()),
    hideBubble: jest.fn(() => Promise.resolve()),
    isBubbleVisible: jest.fn(() => Promise.resolve(false)),
    updateTile: jest.fn(() => Promise.resolve()),
    openBatterySettings: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../src/services/OverlayStateStore', () => ({
  overlayStore: {
    init: jest.fn(),
    destroy: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    getState: jest.fn(() => ({ enabled: false, opacity: 0.3, color: '#000000', presetId: null })),
    syncFromNative: jest.fn(() => Promise.resolve({ enabled: false, opacity: 0.3, color: '#000000', presetId: null })),
    setEnabled: jest.fn(() => Promise.resolve(true)),
    toggle: jest.fn(() => Promise.resolve(true)),
    setOpacity: jest.fn(() => Promise.resolve(true)),
    setColor: jest.fn(() => Promise.resolve()),
    applyPreset: jest.fn(() => Promise.resolve(true)),
    deleteActivePreset: jest.fn(() => Promise.resolve()),
  },
}));

it('renders without crashing', () => {
  render(<App />);
});
