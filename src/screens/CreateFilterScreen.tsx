/**
 * NightShade V4 — Create Filter Screen
 * Simplified 3-step wizard:
 * Step 1: Choose preset base (Warm, Cool, Neutral, Cinema, AMOLED, Red)
 * Step 2: Adjust color + opacity
 * Step 3: Save name
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../components/AppComponents';
import { S, T, R, QUICK_COLORS } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { FilterPreset } from '../types';
import { storageService } from '../services/StorageService';
import { overlayService } from '../services/OverlayService';
import { genId, pctStr, rgbToHex, hexToRgb, colorLabel, getBrightnessLabel } from '../utils/helpers';
import ColorPicker from '../components/ColorPicker';

interface Props { onClose: () => void; onCreated: () => void }

const CreateFilterScreen: React.FC<Props> = ({ onClose, onCreated }) => {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBase, setSelectedBase] = useState<number>(0);
  const [color, setColor] = useState(QUICK_COLORS[0].color);
  const [opacity, setOpacity] = useState(0.35);
  const [name, setName] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const rgb = hexToRgb(color);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Name Required', 'Please enter a filter name.'); return; }
    const preset: FilterPreset = {
      id: genId(),
      name: name.trim(),
      opacity,
      color,
      isBuiltIn: false,
      category: QUICK_COLORS[selectedBase]?.category || 'custom',
      createdAt: Date.now(),
      lastUsedAt: null,
    };
    await storageService.addPreset(preset);
    onCreated();
    onClose();
  };

  const selectBase = (index: number) => {
    setSelectedBase(index);
    setColor(QUICK_COLORS[index].color);
    // Set a sensible default opacity based on category
    const cat = QUICK_COLORS[index].category;
    if (cat === 'amoled') setOpacity(0.50);
    else if (cat === 'red') setOpacity(0.40);
    else if (cat === 'cinema') setOpacity(0.35);
    else if (cat === 'cool') setOpacity(0.12);
    else if (cat === 'warm') setOpacity(0.30);
    else setOpacity(0.35);
  };

  return (
    <View style={[cf.root, { backgroundColor: palette.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[cf.header, { borderBottomColor: palette.outlineVariant }]}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close" size={24} color={palette.primary} />
        </TouchableOpacity>
        <Text style={{ ...T.titleM, color: palette.onSurface, fontWeight: '700' }}>Create Filter</Text>
        {step === 3 ? (
          <TouchableOpacity onPress={handleSave} style={{ backgroundColor: palette.primary, borderRadius: R.md, paddingHorizontal: S.s4, paddingVertical: S.s2 }}>
            <Text style={{ color: palette.onPrimary, ...T.labelL, fontWeight: '700' }}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setStep((step + 1) as 2 | 3)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: palette.primary, ...T.labelL, fontWeight: '600' }}>Next</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Step indicators */}
      <View style={cf.steps}>
        {[
          { n: 1, label: 'Base', icon: 'palette-outline' },
          { n: 2, label: 'Adjust', icon: 'tune' },
          { n: 3, label: 'Save', icon: 'content-save-outline' },
        ].map(s => (
          <View key={s.n} style={cf.stepItem}>
            <View style={[
              cf.stepCircle,
              {
                backgroundColor: step >= s.n ? palette.primary : palette.surfaceContainerHigh,
                borderColor: step >= s.n ? palette.primary : palette.outlineVariant,
              },
            ]}>
              <Icon name={s.icon} size={16} color={step >= s.n ? palette.onPrimary : palette.onSurfaceVariant} />
            </View>
            <Text style={{
              ...T.labelS,
              color: step >= s.n ? palette.primary : palette.onSurfaceVariant,
              fontWeight: step === s.n ? '700' : '400',
              marginTop: S.s05,
            }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Live Preview */}
      <View style={cf.previewWrap}>
        <View style={[cf.previewCard, { backgroundColor: palette.surfaceContainer }]}>
          <View style={[cf.previewSwatch, { backgroundColor: color, opacity: Math.min(opacity, 1.0) }]} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.titleL, color: palette.onSurface, fontWeight: '700' }}>{color.toUpperCase()}</Text>
            <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant }}>
              {colorLabel(color)} · {pctStr(opacity)} · {getBrightnessLabel(opacity)}
            </Text>
          </View>
        </View>
      </View>

      {/* Step 1: Choose Base */}
      {step === 1 && (
        <View style={cf.stepContent}>
          <Text style={{ ...T.titleM, color: palette.onSurface, marginBottom: S.s2, fontWeight: '600' }}>Choose a Base</Text>
          <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginBottom: S.s4 }}>
            Select a starting point for your filter, then customize it in the next step.
          </Text>
          <View style={cf.baseGrid}>
            {QUICK_COLORS.map((qc, i) => (
              <TouchableOpacity
                key={qc.color}
                style={[
                  cf.baseCard,
                  {
                    backgroundColor: selectedBase === i ? palette.primaryContainer : palette.surfaceContainerHigh,
                    borderColor: selectedBase === i ? palette.primary : palette.outlineVariant,
                  },
                ]}
                onPress={() => selectBase(i)}
                accessibilityLabel={`${qc.label} base`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedBase === i }}
              >
                <View style={[cf.baseSwatch, { backgroundColor: qc.color }]} />
                <Text style={{
                  ...T.labelM,
                  color: selectedBase === i ? palette.onPrimaryContainer : palette.onSurface,
                  fontWeight: '600',
                  marginTop: S.s1,
                }}>
                  {qc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Step 2: Adjust Color + Opacity */}
      {step === 2 && (
        <View style={cf.stepContent}>
          <Text style={{ ...T.titleM, color: palette.onSurface, marginBottom: S.s2, fontWeight: '600' }}>Fine-tune Your Filter</Text>

          {/* Color adjustment */}
          <View style={cf.colorSection}>
            <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginBottom: S.s2 }}>Filter Color</Text>
            <View style={cf.colorRow}>
              {QUICK_COLORS.map(qc => (
                <TouchableOpacity
                  key={qc.color}
                  style={[cf.colorCircle, { backgroundColor: qc.color, borderColor: color === qc.color ? palette.primary : 'transparent', borderWidth: 3 }]}
                  onPress={() => setColor(qc.color)}
                  accessibilityLabel={`Select color ${qc.label}`}
                />
              ))}
              <TouchableOpacity
                style={[cf.colorCircle, { backgroundColor: palette.surfaceContainerHigh, borderColor: palette.outlineVariant, borderWidth: 1 }]}
                onPress={() => setPickerVisible(true)}
                accessibilityLabel="Custom color"
              >
                <Icon name="eyedropper" size={20} color={palette.primary} />
              </TouchableOpacity>
            </View>
            <ColorPicker
              visible={pickerVisible}
              initialColor={color}
              onSelect={(hex) => { setColor(hex); setPickerVisible(false); }}
              onClose={() => setPickerVisible(false)}
            />
          </View>

          {/* Opacity adjustment */}
          <View style={cf.opacitySection}>
            <View style={cf.opacityHeader}>
              <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant }}>Filter Strength</Text>
              <Text style={{ ...T.titleS, color: palette.primary, fontWeight: '700' }}>{pctStr(opacity)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.s2 }}>
              <Icon name="weather-sunny" size={18} color={palette.onSurfaceVariant} />
              <Slider
                style={{ flex: 1, height: S.s12 }}
                minimumValue={0}
                maximumValue={2.0}
                step={0.01}
                value={opacity}
                onValueChange={setOpacity}
                minimumTrackTintColor={palette.primary}
                maximumTrackTintColor={palette.outlineVariant}
                thumbTintColor={palette.primary}
                accessibilityLabel="Filter strength"
              />
              <Icon name="moon-waning-crescent" size={18} color={palette.onSurfaceVariant} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...T.labelS, color: palette.onSurfaceVariant }}>0% - No filter</Text>
              <Text style={{ ...T.labelS, color: palette.outline }}>100%</Text>
              <Text style={{ ...T.labelS, color: palette.onSurfaceVariant }}>200% - Ultra</Text>
            </View>
          </View>
        </View>
      )}

      {/* Step 3: Name & Save */}
      {step === 3 && (
        <View style={cf.stepContent}>
          <Text style={{ ...T.titleM, color: palette.onSurface, marginBottom: S.s2, fontWeight: '600' }}>Name Your Filter</Text>
          <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginBottom: S.s4 }}>
            Choose a memorable name so you can find and apply this filter quickly.
          </Text>
          <TextInput
            style={[cf.input, { backgroundColor: palette.surfaceContainer, color: palette.onSurface, borderColor: palette.outline }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. My Reading Filter"
            placeholderTextColor={palette.onSurfaceVariant}
            maxLength={30}
            autoFocus
          />
          <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant, marginTop: S.s2 }}>
            This filter will appear in your Filter Library and can be applied anytime.
          </Text>
        </View>
      )}
    </View>
  );
};

const cf = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.s4, paddingVertical: S.s3, borderBottomWidth: 1 },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: S.s8, paddingVertical: S.s4 },
  stepItem: { alignItems: 'center' },
  stepCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  previewWrap: { paddingHorizontal: S.s4, paddingVertical: S.s2 },
  previewCard: { flexDirection: 'row', alignItems: 'center', padding: S.s4, borderRadius: R.lg, gap: S.s4 },
  previewSwatch: { width: 56, height: 56, borderRadius: R.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  stepContent: { paddingHorizontal: S.s4, paddingTop: S.s2, flex: 1 },
  // Step 1
  baseGrid: { flexDirection: 'row', gap: S.s3, flexWrap: 'wrap' },
  baseCard: { width: '30%', aspectRatio: 0.85, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, padding: S.s2 },
  baseSwatch: { width: 40, height: 40, borderRadius: 20 },
  // Step 2
  colorSection: { marginBottom: S.s6 },
  colorRow: { flexDirection: 'row', gap: S.s2, flexWrap: 'wrap' },
  colorCircle: { width: 48, height: 48, borderRadius: 24 },
  opacitySection: { marginTop: S.s3 },
  opacityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.s2 },
  // Step 3
  input: { borderRadius: R.md, paddingHorizontal: S.s4, paddingVertical: S.s3, fontSize: 16, borderWidth: 1 },
});

export default CreateFilterScreen;
