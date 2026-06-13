import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, S, T, R, ANIM } from '../theme';

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
  accessibilityLabel?: string;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onToggle, label, accessibilityLabel }) => {
  const animatedValue = useRef(new Animated.Value(enabled ? 1 : 0)).current;


  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: enabled ? 1 : 0,
      duration: ANIM.normal,
      useNativeDriver: false,
    }).start();
  }, [enabled, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.outline, colors.primary],
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggle}
        accessibilityLabel={accessibilityLabel || label || 'Toggle'}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Animated.View style={[styles.track, { backgroundColor }]}>
          <Animated.View
            style={[styles.thumb, { transform: [{ translateX }] }]}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48, // Accessibility: minimum touch target
    paddingVertical: S.s2,
  },
  label: {
    ...T.bodyLg,
    fontWeight: '500',
    flex: 1,
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default Toggle;
