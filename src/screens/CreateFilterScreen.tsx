/**
 * NightShade Revamp — Create Filter Screen (Module F2)
 * 3-step wizard: Base → Adjust → Save
 * Void Architecture design tokens. No glassmorphism/gradient.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { S, T, R, colors, QUICK_COLORS } from '../theme';
import { FilterPreset } from '../types';
import { storageService } from '../services/StorageService';
import { overlayService } from '../services/OverlayService';
import { genId, pctStr, colorLabel, getBrightnessLabel } from '../utils/helpers';
import ColorPicker from '../components/ColorPicker';

interface Props { onClose: () => void; onCreated: () => void }

const MAX_OPACITY = 1.80;

const CreateFilterScreen: React.FC<Props> = ({ onClose, onCreated }) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBase, setSelectedBase] = useState<number>(0);
  const [color, setColor] = useState(QUICK_COLORS[0].color);
  const [opacity, setOpacity] = useState(0.35);
  const [name, setName] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Name Required', 'Please enter a filter name.'); return; }
    const preset: FilterPreset = {
      id: genId(),
      name: name.trim(),
      opacity,
      color,
      isBuiltIn: false,
      category: (QUICK_COLORS[selectedBase]?.category as any) || 'Custom',
      description: `Custom ${QUICK_COLORS[selectedBase]?.label || ''} filter at ${pctStr(opacity)}`,
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
    const cat = QUICK_COLORS[index].category?.toLowerCase() || '';
    if (cat === 'deep') setOpacity(0.50);
    else if (cat === 'cool') setOpacity(0.12);
    else if (cat === 'cinema') setOpacity(0.35);
    else if (cat === 'warm') setOpacity(0.30);
    else if (cat === 'clarity') setOpacity(0.10);
    else setOpacity(0.35);
  };

  return (
    <View style={[cf.root, { backgroundColor: colors.voidBlack, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[cf.header, { borderBottomColor: colors.voidRim }]}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close" size={24} color={colors.accentAmber} />
        </TouchableOpacity>
        <Text style={cf.headerTitle}>Create Filter</Text>
        {step === 3 ? (
          <TouchableOpacity onPress={handleSave} style={[cf.headerBtn, { backgroundColor: colors.accentAmber }]}>
            <Text style={cf.headerBtnText}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setStep((step + 1) as 2 | 3)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={cf.headerNextText}>Next</Text>
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
                backgroundColor: step >= s.n ? colors.accentAmber : colors.voidRim,
                borderColor: step >= s.n ? colors.accentAmber : colors.voidGhost,
              },
            ]}>
              <Icon name={s.icon} size={16} color={step >= s.n ? colors.voidBlack : colors.textMuted} />
            </View>
            <Text style={{
              ...T.labelSm,
              color: step >= s.n ? colors.accentAmber : colors.textMuted,
              fontWeight: step === s.n ? '700' : '400',
              marginTop: S.s05,
            }}>
              {s.label}
            </Text>
          </View>
        ))}
        {/* Connecting lines */}
        <View style={cf.stepLineContainer} pointerEvents="none">
          <View style={[cf.stepLine, { backgroundColor: step >= 2 ? colors.accentAmber : colors.voidRim, left: '16%', right: '50%' }]} />
          <View style={[cf.stepLine, { backgroundColor: step >= 3 ? colors.accentAmber : colors.voidRim, left: '50%', right: '16%' }]} />
        </View>
      </View>

      {/* Live Preview */}
      <View style={cf.previewWrap}>
        <View style={[cf.previewCard, { backgroundColor: colors.voidDeep, borderColor: colors.voidRim }]}>
          <View style={[cf.previewSwatch, { backgroundColor: color, opacity: Math.min(opacity, 1.0) }]} />
          <View style={{ flex: 1 }}>
            <Text style={cf.previewHex}>{color.toUpperCase()}</Text>
            <Text style={cf.previewMeta}>
              {colorLabel(color)} · <Text style={cf.previewMono}>{pctStr(opacity)}</Text> · {getBrightnessLabel(opacity)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={cf.scrollContent}
        contentContainerStyle={{ paddingBottom: S.s8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Choose Base */}
        {step === 1 && (
          <View>
            <Text style={cf.sectionTitle}>Choose a Base</Text>
            <Text style={cf.sectionDesc}>
              Select a starting point for your filter, then customize it in the next step.
            </Text>
            <View style={cf.baseGrid}>
              {QUICK_COLORS.map((qc, i) => (
                <TouchableOpacity
                  key={qc.color + qc.label}
                  style={[
                    cf.baseCard,
                    {
                      backgroundColor: selectedBase === i ? colors.voidMid : colors.voidDeep,
                      borderColor: selectedBase === i ? colors.accentAmber : colors.voidRim,
                    },
                  ]}
                  onPress={() => selectBase(i)}
                  accessibilityLabel={`${qc.label} base`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedBase === i }}
                >
                  <View style={[cf.baseSwatch, { backgroundColor: qc.color }]} />
                  <Text style={[
                    cf.baseLabel,
                    { color: selectedBase === i ? colors.textPrimary : colors.textSecondary },
                  ]}>
                    {qc.label}
                  </Text>
                  <Text style={cf.baseCategory}>{qc.category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Adjust Color + Opacity */}
        {step === 2 && (
          <View>
            <Text style={cf.sectionTitle}>Fine-tune Your Filter</Text>

            {/* Color adjustment */}
            <View style={cf.colorSection}>
              <Text style={cf.subLabel}>Filter Color</Text>
              <View style={cf.colorRow}>
                {QUICK_COLORS.map(qc => (
                  <TouchableOpacity
                    key={qc.color + qc.label}
                    style={[
                      cf.colorCircle,
                      {
                        backgroundColor: qc.color,
                        borderColor: color === qc.color ? colors.accentAmber : colors.voidRim,
                        borderWidth: color === qc.color ? 3 : 1,
                      },
                    ]}
                    onPress={() => setColor(qc.color)}
                    accessibilityLabel={`Select color ${qc.label}`}
                  />
                ))}
                <TouchableOpacity
                  style={[cf.colorCircle, { backgroundColor: colors.voidRim, borderColor: colors.voidGhost, borderWidth: 1 }]}
                  onPress={() => setPickerVisible(true)}
                  accessibilityLabel="Custom color"
                >
                  <Icon name="eyedropper" size={20} color={colors.accentAmber} />
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
                <Text style={cf.subLabel}>Filter Strength</Text>
                <Text style={cf.opacityValue}>{pctStr(opacity)}</Text>
              </View>
              <View style={cf.sliderRow}>
                <Icon name="weather-sunny" size={18} color={colors.textMuted} />
                <Slider
                  style={cf.slider}
                  minimumValue={0}
                  maximumValue={MAX_OPACITY}
                  step={0.01}
                  value={opacity}
                  onValueChange={setOpacity}
                  minimumTrackTintColor={colors.accentAmber}
                  maximumTrackTintColor={colors.voidRim}
                  thumbTintColor={colors.accentAmber}
                  accessibilityLabel="Filter strength"
                />
                <Icon name="moon-waning-crescent" size={18} color={colors.textMuted} />
              </View>
              <View style={cf.sliderLabels}>
                <Text style={cf.sliderLabelEnd}>0%</Text>
                <Text style={cf.sliderLabelMid}>100%</Text>
                <Text style={cf.sliderLabelEnd}>180%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Name & Save */}
        {step === 3 && (
          <View>
            <Text style={cf.sectionTitle}>Name Your Filter</Text>
            <Text style={cf.sectionDesc}>
              Choose a memorable name so you can find and apply this filter quickly.
            </Text>
            <TextInput
              style={[cf.input, { backgroundColor: colors.voidDeep, color: colors.textPrimary, borderColor: colors.voidRim }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. My Reading Filter"
              placeholderTextColor={colors.textMuted}
              maxLength={30}
              autoFocus
            />
            <Text style={cf.inputHint}>
              This filter will appear in your Filter Library and can be applied anytime.
            </Text>

            {/* Summary card */}
            <View style={[cf.summaryCard, { backgroundColor: colors.voidDeep, borderColor: colors.voidRim }]}>
              <Text style={cf.summaryLabel}>FILTER SUMMARY</Text>
              <View style={cf.summaryRow}>
                <Text style={cf.summaryKey}>Color</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.s2 }}>
                  <View style={[cf.summarySwatch, { backgroundColor: color }]} />
                  <Text style={cf.summaryVal}>{colorLabel(color)}</Text>
                </View>
              </View>
              <View style={[cf.summaryDivider, { backgroundColor: colors.voidRim }]} />
              <View style={cf.summaryRow}>
                <Text style={cf.summaryKey}>Strength</Text>
                <Text style={cf.summaryMono}>{pctStr(opacity)}</Text>
              </View>
              <View style={[cf.summaryDivider, { backgroundColor: colors.voidRim }]} />
              <View style={cf.summaryRow}>
                <Text style={cf.summaryKey}>Category</Text>
                <Text style={cf.summaryVal}>{QUICK_COLORS[selectedBase]?.category || 'Custom'}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const cf = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.s4,
    paddingVertical: S.s3,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...T.heading2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  headerBtn: {
    borderRadius: R.radiusMd,
    paddingHorizontal: S.s5,
    paddingVertical: S.s2,
  },
  headerBtnText: {
    ...T.labelLg,
    color: colors.voidBlack,
    fontWeight: '700',
  },
  headerNextText: {
    ...T.labelLg,
    color: colors.accentAmber,
    fontWeight: '600',
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: S.s8,
    paddingVertical: S.s4,
    position: 'relative',
  },
  stepItem: { alignItems: 'center', zIndex: 2 },
  stepCircle: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepLineContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  stepLine: {
    position: 'absolute',
    top: 0,
    height: 2,
  },
  previewWrap: {
    paddingHorizontal: S.s4,
    paddingVertical: S.s2,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: S.s4,
    borderRadius: R.radiusLg,
    gap: S.s4,
    borderWidth: 1,
  },
  previewSwatch: {
    width: 56, height: 56,
    borderRadius: R.radiusMd,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  previewHex: {
    ...T.heading2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  previewMeta: {
    ...T.bodySm,
    color: colors.textSecondary,
    marginTop: S.s05,
  },
  previewMono: {
    ...T.monoNum,
    fontSize: T.bodySm.size,
    lineHeight: T.bodySm.line,
    color: colors.accentAmber,
  },
  scrollContent: {
    paddingHorizontal: S.s4,
    paddingTop: S.s2,
    flex: 1,
  },
  sectionTitle: {
    ...T.heading2,
    color: colors.textPrimary,
    marginBottom: S.s2,
    fontWeight: '600',
  },
  sectionDesc: {
    ...T.bodyLg,
    color: colors.textSecondary,
    marginBottom: S.s4,
  },
  subLabel: {
    ...T.labelLg,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: S.s2,
  },
  // Step 1: Base
  baseGrid: {
    flexDirection: 'row',
    gap: S.s3,
    flexWrap: 'wrap',
  },
  baseCard: {
    width: '30%',
    aspectRatio: 0.85,
    borderRadius: R.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    padding: S.s2,
  },
  baseSwatch: {
    width: 40, height: 40,
    borderRadius: 20,
  },
  baseLabel: {
    ...T.labelSm,
    fontWeight: '600',
    marginTop: S.s1,
  },
  baseCategory: {
    ...T.labelSm,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: S.s05,
  },
  // Step 2: Adjust
  colorSection: { marginBottom: S.s6 },
  colorRow: { flexDirection: 'row', gap: S.s2, flexWrap: 'wrap' },
  colorCircle: { width: 48, height: 48, borderRadius: 24 },
  opacitySection: { marginTop: S.s3 },
  opacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.s2,
  },
  opacityValue: {
    ...T.monoNum,
    color: colors.accentAmber,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.s2,
  },
  slider: { flex: 1, height: S.s12 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelEnd: {
    ...T.labelSm,
    color: colors.textMuted,
  },
  sliderLabelMid: {
    ...T.labelSm,
    color: colors.textMuted,
  },
  // Step 3: Save
  input: {
    borderRadius: R.radiusMd,
    paddingHorizontal: S.s4,
    paddingVertical: S.s3,
    fontSize: T.bodyLg.size,
    borderWidth: 1,
    fontFamily: 'Inter',
  },
  inputHint: {
    ...T.bodySm,
    color: colors.textMuted,
    marginTop: S.s2,
  },
  summaryCard: {
    marginTop: S.s5,
    borderRadius: R.radiusLg,
    padding: S.s4,
    borderWidth: 1,
  },
  summaryLabel: {
    ...T.labelLg,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: S.s3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: S.s2,
  },
  summaryKey: {
    ...T.bodyLg,
    color: colors.textSecondary,
  },
  summaryVal: {
    ...T.bodyLg,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  summaryMono: {
    ...T.monoNum,
    color: colors.accentAmber,
  },
  summarySwatch: {
    width: 16,
    height: 16,
    borderRadius: R.radiusXs,
  },
  summaryDivider: {
    height: 1,
  },
});

export default CreateFilterScreen;
