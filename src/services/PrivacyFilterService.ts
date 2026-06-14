import { NativeModules } from 'react-native';
import { PrivacyDensity } from '../types';

const { OverlayModule } = NativeModules;

export const PrivacyFilterService = {
  async start(density: PrivacyDensity = 'standard', opacity: number = 0.75): Promise<void> {
    await OverlayModule.startPrivacyFilter(density, opacity);
  },

  async stop(): Promise<void> {
    await OverlayModule.stopPrivacyFilter();
  },

  async isActive(): Promise<boolean> {
    return OverlayModule.isPrivacyFilterActive();
  },
};
