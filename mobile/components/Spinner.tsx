/**
 * PlaneSpinner — matches the web design's PlaneSpinner:
 *   • filled plane SVG orbiting a dashed ring
 *   • globe centered at 50 % opacity
 *   • optional loading label below
 */
import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import Icon from './Icon';
import {useTheme} from '../context/ThemeContext';
import {spacing, typography} from '../theme';

const ORBIT = 96;   // orbit container diameter (pt)
const PLANE = 32;   // plane icon size — matches web's 32×32 SVG

// Filled plane path from the web design (32×32 viewBox)
const PLANE_PATH =
  'M4.5 17.6l4 1.4 6-6L5 9.2l1.8-1.8 11 4.3 5.3-5.3a2.7 2.7 0 0 1 3.8 3.8' +
  'l-5.3 5.3 4.3 11-1.8 1.8-5.8-9.5-6 6 1.4 4-1.6 1.6-3.2-4.8L4.4 22.5z';

export function PlaneSpinner({label = 'Loading…'}: {label?: string}) {
  const {theme, colors} = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [rotation]);

  const spin = rotation.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

  const styles = useMemo(() => StyleSheet.create({
    stage:     {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, padding: spacing['2xl']},
    orbitWrap: {width: ORBIT, height: ORBIT, alignItems: 'center', justifyContent: 'center'},
    // plane is pinned to the top edge of the orbit; the Animated.View rotates it around
    planeDot:  {position: 'absolute', top: -(PLANE / 2), left: ORBIT / 2 - PLANE / 2},
    label:     {fontSize: typography.bodySmall, color: colors.textSecondary, opacity: 0.85},
  }), [theme]);

  return (
    <View style={styles.stage}>
      <View style={styles.orbitWrap}>

        {/* Globe — centred, 50 % opacity, matching the web design */}
        <View style={{opacity: 0.5}}>
          <Icon name="globe" size={42} color={colors.textPrimary}/>
        </View>

        {/* Dashed orbit ring */}
        <Svg
          style={{backgroundColor: 'transparent', position: 'absolute', top: 0, left: 0}}
          width={ORBIT}
          height={ORBIT}>
          <Circle
            cx={ORBIT / 2} cy={ORBIT / 2} r={ORBIT / 2 - 2}
            stroke={colors.textTertiary}
            strokeWidth={1.5}
            strokeDasharray="6 8"
            fill="none"
            opacity={0.45}
          />
        </Svg>

        {/* Orbiting plane — filled path from the web design */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {transform: [{rotate: spin}]},
          ]}>
          <View style={styles.planeDot}>
            <Svg
              width={PLANE}
              height={PLANE}
              viewBox="0 0 32 32"
              style={{backgroundColor: 'transparent'}}>
              <Path d={PLANE_PATH} fill={colors.accent}/>
            </Svg>
          </View>
        </Animated.View>

      </View>

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}
