// App color palette - dark theme optimized for screen filter app
export const Colors = {
  // Primary
  primary: '#6C63FF',
  primaryDark: '#4A42D4',
  primaryLight: '#8B83FF',

  // Backgrounds
  background: '#0D0D0D',
  backgroundSecondary: '#1A1A1A',
  backgroundCard: '#242424',
  backgroundElevated: '#2D2D2D',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#707070',

  // Overlay filter colors
  filterBlack: '#000000',
  filterWarm: '#FF9800',
  filterRed: '#F44336',
  filterBlue: '#2196F3',
  filterGreen: '#4CAF50',
  filterCustom: '#6C63FF',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Toggle
  toggleActive: '#6C63FF',
  toggleInactive: '#3D3D3D',

  // Slider
  sliderTrack: '#3D3D3D',
  sliderThumb: '#6C63FF',

  // Borders
  border: '#3D3D3D',
  borderLight: '#2D2D2D',

  // Opacity levels for UI
  disabled: 0.4,
  overlay: 0.8,
};

// Color mode definitions
export const ColorModes = [
  { name: 'Black', color: '#000000', label: 'Dim' },
  { name: 'Warm', color: '#FF9800', label: 'Warm' },
  { name: 'Red', color: '#F44336', label: 'Red' },
  { name: 'Blue', color: '#2196F3', label: 'Blue' },
  { name: 'Green', color: '#4CAF50', label: 'Green' },
  { name: 'Custom', color: '#6C63FF', label: 'Custom' },
] as const;
