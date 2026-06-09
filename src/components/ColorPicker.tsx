/**
 * NightShade V4 — Color Picker (Fixed & Reliable)
 * Uses a hue bar instead of broken wheel, plus saturation/brightness area,
 * RGB sliders, HEX input, and opacity control.
 *
 * The color wheel approach was unreliable due to React Native limitations
 * with transformOrigin and PanResponder coordinate mapping.
 * This implementation uses a proven hue-bar + SV-area approach.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, Dimensions, PanResponder } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { S, T, R, ANIM } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, clamp } from '../utils/helpers';

const SCREEN_W = Dimensions.get('window').width;
const HUE_BAR_W = SCREEN_W - S.s8 * 2;
const SV_AREA_W = SCREEN_W - S.s8 * 2;
const SV_AREA_H = 200;

interface Props {
  visible: boolean;
  initialColor: string;
  onSelect: (hex: string, opacity: number) => void;
  onClose: () => void;
}

const ColorPicker: React.FC<Props> = ({ visible, initialColor, onSelect, onClose }) => {
  const { palette } = useAppTheme();
  const [tab, setTab] = useState<'visual' | 'rgb' | 'hex'>('visual');

  // Parse initial color into HSV
  const initialRgb = useMemo(() => hexToRgb(initialColor), [initialColor]);
  const initialHsv = useMemo(() => rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b), [initialRgb]);

  const [hsv, setHsv] = useState({ h: initialHsv.h, s: initialHsv.s, v: initialHsv.v });
  const [opacity, setOpacity] = useState(0.35);
  const [hexInput, setHexInput] = useState(initialColor);

  // Compute current RGB from HSV
  const currentRgb = useMemo(() => hsvToRgb(hsv.h, hsv.s, hsv.v), [hsv]);
  const currentHex = useMemo(() => rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b), [currentRgb]);

  // ─── Hue Bar PanResponder ─────────────────────────────────────
  const huePan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: e => updateHueFromTouch(e.nativeEvent.locationX),
    onPanResponderMove: e => updateHueFromTouch(e.nativeEvent.locationX),
  }), [hsv]);

  const updateHueFromTouch = useCallback((x: number) => {
    const h = clamp((x / HUE_BAR_W) * 360, 0, 359.9);
    const newHsv = { ...hsv, h };
    setHsv(newHsv);
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(rgbToHex(rgb.r, rgb.g, rgb.b));
  }, [hsv]);

  // ─── Saturation/Value Area PanResponder ───────────────────────
  const svPan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: e => updateSVFromTouch(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onPanResponderMove: e => updateSVFromTouch(e.nativeEvent.locationX, e.nativeEvent.locationY),
  }), [hsv]);

  const updateSVFromTouch = useCallback((x: number, y: number) => {
    const s = clamp((x / SV_AREA_W) * 100, 0, 100);
    const v = clamp(100 - (y / SV_AREA_H) * 100, 0, 100);
    const newHsv = { ...hsv, s, v };
    setHsv(newHsv);
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(rgbToHex(rgb.r, rgb.g, rgb.b));
  }, [hsv]);

  // ─── RGB Handlers ─────────────────────────────────────────────
  const onRgb = (ch: 'r' | 'g' | 'b', val: number) => {
    const nr = { ...currentRgb, [ch]: val };
    const newHsv = rgbToHsv(nr.r, nr.g, nr.b);
    setHsv(newHsv);
    setHexInput(rgbToHex(nr.r, nr.g, nr.b));
  };

  // ─── HEX Handler ──────────────────────────────────────────────
  const onHexSubmit = () => {
    let clean = hexInput.replace(/[^0-9A-Fa-f]/g, '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length === 6) {
      const newRgb = hexToRgb('#' + clean);
      setHsv(rgbToHsv(newRgb.r, newRgb.g, newRgb.b));
      setHexInput(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }
  };

  const handleApply = () => onSelect(currentHex, opacity);

  // Indicator positions
  const hueIndicatorX = (hsv.h / 360) * HUE_BAR_W;
  const svIndicatorX = (hsv.s / 100) * SV_AREA_W;
  const svIndicatorY = (1 - hsv.v / 100) * SV_AREA_H;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[cp.container, { backgroundColor: palette.background }]}>
        {/* Header */}
        <View style={[cp.header, { borderBottomColor: palette.outlineVariant }]}>
          <TouchableOpacity onPress={onClose} style={cp.headerBtn}>
            <Text style={{ color: palette.primary, ...T.labelL }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ ...T.titleM, color: palette.onSurface, fontWeight: '700' }}>Color Picker</Text>
          <TouchableOpacity onPress={handleApply} style={[cp.applyBtn, { backgroundColor: palette.primary }]}>
            <Text style={{ color: palette.onPrimary, ...T.labelL, fontWeight: '700' }}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Live Preview */}
        <View style={cp.previewWrap}>
          <View style={[cp.previewCard, { backgroundColor: palette.surfaceContainer }]}>
            <View style={[cp.swatch, { backgroundColor: currentHex, opacity }]} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...T.titleL, color: palette.onSurface, fontWeight: '700' }}>{currentHex.toUpperCase()}</Text>
              <Text style={{ ...T.bodyS, color: palette.onSurfaceVariant }}>
                RGB({currentRgb.r}, {currentRgb.g}, {currentRgb.b}) · {Math.round(opacity * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Opacity Slider */}
        <View style={cp.opacityRow}>
          <Icon name="circle-opacity" size={18} color={palette.onSurfaceVariant} />
          <Text style={{ ...T.labelM, color: palette.onSurfaceVariant, marginLeft: S.s1 }}>Filter Strength</Text>
          <Text style={{ ...T.labelM, color: palette.primary, fontWeight: '700', marginLeft: 'auto' }}>{Math.round(opacity * 100)}%</Text>
        </View>
        <Slider style={cp.opacitySlider} minimumValue={0} maximumValue={1} step={0.01} value={opacity}
          onValueChange={setOpacity} minimumTrackTintColor={palette.primary} maximumTrackTintColor={palette.outlineVariant}
          thumbTintColor={palette.primary} accessibilityLabel="Filter opacity" />

        {/* Tab selector */}
        <View style={[cp.tabRow, { backgroundColor: palette.surfaceContainerHigh }]}>
          {(['visual', 'rgb', 'hex'] as const).map(t => (
            <TouchableOpacity key={t} style={[cp.tab, tab === t && { backgroundColor: palette.primary }]}
              onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
              <Text style={{ ...T.labelM, color: tab === t ? palette.onPrimary : palette.onSurfaceVariant, fontWeight: '600' }}>
                {t === 'visual' ? 'Visual' : t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Visual Tab: Hue Bar + SV Area */}
        {tab === 'visual' && (
          <View style={cp.visualWrap}>
            {/* Hue Bar */}
            <Text style={{ ...T.labelM, color: palette.onSurfaceVariant, marginBottom: S.s2 }}>Hue</Text>
            <View style={cp.hueBarWrap} {...huePan.panHandlers}>
              {/* Rainbow gradient using colored segments */}
              <View style={cp.hueBar}>
                {Array.from({ length: 60 }).map((_, i) => {
                  const hue = (i / 60) * 360;
                  const c = hsvToRgb(hue, 100, 100);
                  return (
                    <View key={i} style={[cp.hueSegment, { backgroundColor: rgbToHex(c.r, c.g, c.b) }]} />
                  );
                })}
              </View>
              {/* Hue indicator */}
              <View style={[cp.hueIndicator, { left: hueIndicatorX - 8 }]} />
            </View>

            {/* Saturation/Value Area */}
            <Text style={{ ...T.labelM, color: palette.onSurfaceVariant, marginTop: S.s4, marginBottom: S.s2 }}>Saturation / Brightness</Text>
            <View style={[cp.svAreaWrap, { borderColor: palette.outlineVariant }]} {...svPan.panHandlers}>
              {/* SV area rendered with background color + white/black overlays */}
              <View style={[cp.svArea, { backgroundColor: currentHex }]}>
                <View style={cp.svWhiteOverlay} />
                <View style={cp.svBlackOverlay} />
              </View>
              {/* SV indicator */}
              <View style={[cp.svIndicator, { left: svIndicatorX - 8, top: svIndicatorY - 8 }]} />
            </View>
          </View>
        )}

        {/* RGB Tab */}
        {tab === 'rgb' && (
          <View style={cp.slidersWrap}>
            {([
              { ch: 'r' as const, label: 'Red', color: '#F44336', icon: 'circle-slice-8' },
              { ch: 'g' as const, label: 'Green', color: '#4CAF50', icon: 'circle-slice-8' },
              { ch: 'b' as const, label: 'Blue', color: '#2196F3', icon: 'circle-slice-8' },
            ]).map(({ ch, label, color, icon }) => (
              <View key={ch} style={cp.sliderRow}>
                <Icon name={icon} size={16} color={color} />
                <Text style={{ ...T.bodyM, color: palette.onSurface, width: 52, fontWeight: '500', marginLeft: S.s1 }}>{label}</Text>
                <Slider style={cp.slider} minimumValue={0} maximumValue={255} step={1} value={currentRgb[ch]}
                  onValueChange={v => onRgb(ch, v)} minimumTrackTintColor={color}
                  maximumTrackTintColor={palette.outlineVariant} thumbTintColor={color} />
                <Text style={{ ...T.bodyM, color: palette.onSurface, width: 32, textAlign: 'right' }}>{currentRgb[ch]}</Text>
              </View>
            ))}
          </View>
        )}

        {/* HEX Tab */}
        {tab === 'hex' && (
          <View style={cp.hexWrap}>
            <Text style={{ ...T.bodyM, color: palette.onSurfaceVariant, marginBottom: S.s2 }}>Enter HEX color</Text>
            <TextInput
              style={[cp.hexInput, { backgroundColor: palette.surfaceContainer, color: palette.onSurface, borderColor: palette.outline }]}
              value={hexInput}
              onChangeText={setHexInput}
              onSubmitEditing={onHexSubmit}
              placeholder="#FF9800"
              placeholderTextColor={palette.onSurfaceVariant}
              autoCapitalize="characters"
              maxLength={7}
              autoFocus
            />
            <TouchableOpacity style={[cp.hexApply, { backgroundColor: palette.primary }]} onPress={onHexSubmit}>
              <Text style={{ color: palette.onPrimary, ...T.labelL, fontWeight: '700' }}>Apply HEX</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const cp = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.s4, paddingVertical: S.s3, borderBottomWidth: 1 },
  headerBtn: { padding: S.s2, minHeight: S.s12, justifyContent: 'center' },
  applyBtn: { borderRadius: R.md, paddingHorizontal: S.s4, paddingVertical: S.s2, minHeight: S.s10, justifyContent: 'center' },
  previewWrap: { paddingHorizontal: S.s4, paddingTop: S.s4 },
  previewCard: { flexDirection: 'row', alignItems: 'center', padding: S.s4, borderRadius: R.lg, gap: S.s4 },
  swatch: { width: 56, height: 56, borderRadius: R.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  opacityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s4, marginTop: S.s4 },
  opacitySlider: { marginHorizontal: S.s4, height: S.s12 },
  tabRow: { flexDirection: 'row', marginHorizontal: S.s4, marginTop: S.s4, borderRadius: R.md, padding: 3, gap: 2 },
  tab: { flex: 1, paddingVertical: S.s2, alignItems: 'center', borderRadius: R.sm, minHeight: S.s10, justifyContent: 'center' },
  // Visual tab
  visualWrap: { paddingHorizontal: S.s4, paddingTop: S.s4 },
  hueBarWrap: { position: 'relative', height: 32, borderRadius: R.sm, overflow: 'hidden' },
  hueBar: { flexDirection: 'row', height: 32 },
  hueSegment: { flex: 1, height: 32 },
  hueIndicator: { position: 'absolute', top: 0, width: 16, height: 32, borderRadius: 4, borderWidth: 3, borderColor: '#FFF', backgroundColor: 'transparent', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2 },
  svAreaWrap: { position: 'relative', height: SV_AREA_H, width: SV_AREA_W, borderRadius: R.sm, overflow: 'hidden', borderWidth: 1 },
  svArea: { flex: 1 },
  svWhiteOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'linear-gradient(to right, #FFF, transparent)' },
  svBlackOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'linear-gradient(to top, #000, transparent)' },
  svIndicator: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#FFF', backgroundColor: 'transparent', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2 },
  // RGB tab
  slidersWrap: { paddingHorizontal: S.s4, paddingTop: S.s6 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.s4, gap: S.s2 },
  slider: { flex: 1, height: S.s12 },
  // HEX tab
  hexWrap: { paddingHorizontal: S.s4, paddingTop: S.s6 },
  hexInput: { borderRadius: R.md, paddingHorizontal: S.s4, paddingVertical: S.s3, fontSize: 18, fontFamily: 'monospace', borderWidth: 1, marginBottom: S.s3 },
  hexApply: { borderRadius: R.md, paddingVertical: S.s3, alignItems: 'center', minHeight: S.s12, justifyContent: 'center' },
});

export default ColorPicker;
