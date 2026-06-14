/**
 * NightShade Revamp — Core Color Tokens
 *
 * Extracted from theme/index.ts to break the circular dependency
 * between theme/index.ts ↔ theme/colors.ts.
 * Both files now import from this single source of truth.
 */

export const colors = {
  // Surfaces
  voidBlack:      '#08090B',  // Deepest background
  voidDeep:       '#0D0F14',  // Card surface
  voidMid:        '#14171F',  // Elevated card
  voidRim:        '#1C2030',  // Border / separator
  voidGhost:      '#2A2E3E',  // Muted surface, input fields

  // Text
  textPrimary:    '#F0F2F7',  // Main text — not pure white
  textSecondary:  '#8A90A8',  // Subtext, labels
  textMuted:      '#4A5068',  // Disabled, hint text

  // Accent
  accentAmber:    '#E8A040',  // Primary accent — warm, precise
  accentAmberDim: '#A86820',  // Secondary accent state
  accentIce:      '#5BB8D4',  // Cool accent, contrast pair to amber

  // Status
  statusOn:       '#3DDC84',  // Android green — filter active
  statusOff:      '#4A5068',  // Filter inactive
  danger:         '#E85540',  // Emergency reset, warnings

  // Legacy compat (redirected to void tokens)
  primary:        '#E8A040',
  onPrimary:      '#08090B',
  primaryContainer: '#2A2E3E',
  onPrimaryContainer: '#F0F2F7',
  secondary:      '#5BB8D4',
  onSecondary:    '#08090B',
  secondaryContainer: '#1C2030',
  onSecondaryContainer: '#F0F2F7',
  tertiary:       '#A86820',
  onTertiary:     '#F0F2F7',
  tertiaryContainer: '#2A2E3E',
  onTertiaryContainer: '#E8A040',
  error:          '#E85540',
  onError:        '#F0F2F7',
  errorContainer: '#3A1A1A',
  onErrorContainer: '#E85540',
  surface:        '#0D0F14',
  onSurface:      '#F0F2F7',
  surfaceVariant: '#2A2E3E',
  onSurfaceVariant: '#8A90A8',
  surfaceContainerLow: '#0D0F14',
  surfaceContainer: '#14171F',
  surfaceContainerHigh: '#1C2030',
  surfaceContainerHighest: '#2A2E3E',
  inverseSurface: '#F0F2F7',
  inverseOnSurface: '#08090B',
  inversePrimary: '#A86820',
  outline:        '#2A2E3E',
  outlineVariant: '#1C2030',
  background:     '#08090B',
  scrim:          '#000000',
  success:        '#3DDC84',
  warning:        '#E8A040',
  info:           '#5BB8D4',
} as const;
