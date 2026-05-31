/**
 * JS-side splash screen — shown while ThemeProvider reads the persisted
 * theme from AsyncStorage (typically <100 ms).
 *
 * Intentionally hardcoded to the midnight theme's primary colour so it
 * blends seamlessly with the native LaunchScreen.storyboard, regardless
 * of which theme was last active.
 */
import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

// Hardcoded midnight primary[700] — matches LaunchScreen.storyboard bg
const BG   = '#0B2150';
const ICON = require('../assets/icon.png');

// iOS squircle approximation: ~22% of icon display size.
// Clips the opaque-white corners baked into the PNG artwork.
const ICON_SIZE   = 100;
const ICON_RADIUS = 22;

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconClip}>
        <Image source={ICON} style={styles.icon} resizeMode="cover"/>
      </View>
      <Text style={styles.name}>PlanMyTrip</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // overflow:hidden on the wrapping View is what actually clips the corners —
  // borderRadius on <Image> alone doesn't reliably clip on all iOS versions.
  iconClip: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    overflow: 'hidden',
    marginBottom: 20,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  name: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
