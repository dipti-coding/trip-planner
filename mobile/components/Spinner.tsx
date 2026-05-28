/**
 * PlaneSpinner — animated orbit ring with a plane icon circling a globe.
 * Ported from the web design's PlaneSpinner component.
 */
import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import Icon from './Icon';
import {colors, spacing, typography} from '../theme';

const ORBIT = 96;   // orbit container diameter (px)
const PLANE = 22;   // plane icon size

export function PlaneSpinner({label = 'Loading…'}: {label?: string}) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [rotation]);

  const spin = rotation.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

  return (
    <View style={styles.stage}>
      <View style={styles.orbitWrap}>
        {/* Globe in centre */}
        <Icon name="globe" size={42} color={colors.textTertiary}/>

        {/* Dashed orbit ring drawn with SVG */}
        <Svg style={StyleSheet.absoluteFill} width={ORBIT} height={ORBIT}>
          <Circle
            cx={ORBIT / 2} cy={ORBIT / 2} r={ORBIT / 2 - 2}
            stroke={colors.textTertiary}
            strokeWidth={1.5}
            strokeDasharray="6 8"
            fill="none"
            opacity={0.4}
          />
        </Svg>

        {/* Orbiting plane — rotate the container, pin the icon at the top edge */}
        <Animated.View style={[StyleSheet.absoluteFill, {transform: [{rotate: spin}]}]}>
          <View style={styles.planeDot}>
            <Icon name="plane" size={PLANE} color={colors.accent}/>
          </View>
        </Animated.View>
      </View>

      {/* Pulsing dots */}
      <PulsingDots/>

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

function PulsingDots() {
  const anims = [0, 1, 2].map(() => useRef(new Animated.Value(0.35)).current);

  useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(a, {toValue: 1, duration: 400, useNativeDriver: true}),
          Animated.timing(a, {toValue: 0.35, duration: 400, useNativeDriver: true}),
        ]),
      ),
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={styles.dots}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={[styles.dot, {opacity: a}]}/>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    padding: spacing['2xl'],
  },
  orbitWrap: {
    width: ORBIT, height: ORBIT,
    alignItems: 'center', justifyContent: 'center',
  },
  planeDot: {
    position: 'absolute',
    top: -PLANE / 2,
    left: ORBIT / 2 - PLANE / 2,
  },
  dots: {flexDirection: 'row', gap: spacing.sm, alignItems: 'center'},
  dot: {width: 5, height: 5, borderRadius: 999, backgroundColor: colors.textPrimary},
  label: {fontSize: typography.bodySmall, color: colors.textSecondary, opacity: 0.85},
});
