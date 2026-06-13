/**
 * NightShade Revamp — Colors
 * DEPRECATED: Use tokens from theme/index.ts instead.
 * This file re-exports the Void Architecture tokens for backward compat.
 */

import { colors } from './index';

// Redirect all old Colors references to the new Void token system
export const Colors = {
  primary: colors.accentAmber,
  primaryDark: colors.accentAmberDim,
  primaryLight: colors.accentAmber,

  background: colors.voidBlack,
  backgroundSecondary: colors.voidDeep,
  backgroundCard: colors.voidMid,
  backgroundElevated: colors.voidRim,

  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textTertiary: colors.textMuted,

  filterBlack: '#000000',
  filterWarm: colors.accentAmber,
  filterRed: colors.danger,
  filterBlue: colors.accentIce,
  filterGreen: colors.statusOn,
  filterCustom: colors.accentAmber,

  success: colors.statusOn,
  warning: colors.accentAmber,
  error: colors.danger,
  info: colors.accentIce,

  toggleActive: colors.accentAmber,
  toggleInactive: colors.voidGhost,

  sliderTrack: colors.voidRim,
  sliderThumb: colors.accentAmber,

  border: colors.voidRim,
  borderLight: colors.voidMid,

  disabled: 0.4,
  overlay: 0.8,
};

export const ColorModes = [
  { name: 'Black',   color: '#000000', label: 'Dim' },
  { name: 'Warm',    color: colors.accentAmber, label: 'Warm' },
  { name: 'Red',     color: colors.danger,  label: 'Red' },
  { name: 'Cool',    color: colors.accentIce, label: 'Cool' },
  { name: 'Cinema',  color: '#C45B1A', label: 'Cinema' },
  { name: 'Custom',  color: colors.accentAmber, label: 'Custom' },
] as const;
