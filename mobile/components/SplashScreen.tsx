/**
 * JS-side splash screen — shown while ThemeProvider reads the persisted
 * theme from AsyncStorage (typically <100 ms).
 *
 * The icon PNG is displayed full-bleed (resizeMode="cover"), so its opaque
 * white corners are pushed off-screen and the mountain artwork fills the
 * frame. A dark overlay preserves text legibility.
 */
import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

const ICON = require('../assets/icon.png');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={ICON} style={StyleSheet.absoluteFill} resizeMode="cover"/>
      <View style={styles.overlay}/>
      <Text style={styles.name}>wandur</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  name: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
});
