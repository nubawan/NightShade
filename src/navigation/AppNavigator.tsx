/**
 * NightShade V4 — Navigation
 * 3-tab dynamic bottom nav + center dock FAB
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '../components/AppComponents';
import { S } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import { BottomTab } from '../types';
import HomeScreen from '../screens/HomeScreen';
import PresetsScreen from '../screens/PresetsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateFilterScreen from '../screens/CreateFilterScreen';

const AppNavigator: React.FC = () => {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<BottomTab>('home');
  const [createVisible, setCreateVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const renderScreen = () => {
    switch (tab) {
      case 'home':
        return <HomeScreen onCreateFilter={() => setCreateVisible(true)} onColorPicker={() => setColorPickerVisible(true)} />;
      case 'presets':
        return <PresetsScreen onCreateFilter={() => setCreateVisible(true)} />;
      case 'settings':
        return <SettingsScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
      {/* Dynamic Bottom Nav with Center Dock FAB */}
      <BottomNav
        active={tab}
        onTab={setTab}
        onFabPress={() => setCreateVisible(true)}
      />
      {/* Create Filter Modal */}
      <Modal
        visible={createVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCreateVisible(false)}
      >
        <CreateFilterScreen
          onClose={() => setCreateVisible(false)}
          onCreated={() => { setTab('presets'); }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default AppNavigator;
