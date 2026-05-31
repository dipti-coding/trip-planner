/**
 * JS-side splash screen — shown while ThemeProvider reads the persisted
 * theme from AsyncStorage (typically <100 ms).
 *
 * Uses explicit Dimensions values for the background Image so that
 * resizeMode="cover" fires reliably in React Native Fabric. With
 * StyleSheet.absoluteFill the Image can render at its natural 1024×1024 pt
 * size and show only the top-left corner of the artwork.
 */
import React from 'react';
import {Dimensions, Image, StatusBar, StyleSheet, Text, View} from 'react-native';

const ICON           = require('../assets/icon.png');
const {width, height} = Dimensions.get('screen');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content"/>
      <Image source={ICON} style={styles.bg} resizeMode="cover"/>
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
  // Explicit pixel dimensions make resizeMode="cover" reliable in Fabric.
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  name: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
});
