/**
 * CSS-painted city silhouettes — ported from the web design's inline SVG cover art.
 * Each component fills its parent absolutely (use inside a positioned View).
 * City detection helper returns the right cover for a destination string.
 */
import React from 'react';
import {StyleSheet} from 'react-native';
import Svg, {Circle, G, Polygon, Rect} from 'react-native-svg';

const fill = (color: string, opacity?: number) =>
  ({fill: color, stroke: 'none', ...(opacity !== undefined ? {opacity} : {})});

export function TokyoCover() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="none">
      <Circle cx="295" cy="32" r="22" fill="#FFD6B0" opacity="0.85"/>
      <G {...fill('#3D2447', 0.78)}>
        <Rect x="0"   y="92"  width="40"  height="48"/>
        <Rect x="40"  y="78"  width="22"  height="62"/>
        <Rect x="62"  y="86"  width="32"  height="54"/>
        <Polygon points="100,140 110,60 120,140"/>
        <Rect x="118" y="74"  width="26"  height="66"/>
        <Rect x="144" y="84"  width="20"  height="56"/>
        <Polygon points="170,140 180,40 184,38 188,40 192,140"/>
        <Rect x="196" y="82"  width="34"  height="58"/>
        <Rect x="232" y="92"  width="18"  height="48"/>
        <Rect x="250" y="70"  width="38"  height="70"/>
        <Rect x="288" y="86"  width="24"  height="54"/>
        <Rect x="312" y="78"  width="30"  height="62"/>
        <Rect x="342" y="92"  width="18"  height="48"/>
      </G>
    </Svg>
  );
}

export function IcelandCover() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="none">
      <Circle cx="60" cy="34" r="14" fill="#F5F1E0" opacity="0.4"/>
      <G {...fill('#1A2640', 0.55)}>
        <Polygon points="0,140 60,60 110,140"/>
        <Polygon points="90,140 160,40 230,140"/>
        <Polygon points="200,140 260,70 320,140"/>
        <Polygon points="290,140 340,80 360,140"/>
      </G>
      {/* Snow caps */}
      <G {...fill('rgba(255,255,255,0.65)')}>
        <Polygon points="140,76 156,60 172,76"/>
        <Polygon points="240,98 256,85 270,98"/>
      </G>
    </Svg>
  );
}

export function ParisCover() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="none">
      <G {...fill('#5C2B45', 0.7)}>
        <Rect x="0"   y="100" width="80"  height="40"/>
        <Rect x="80"  y="92"  width="60"  height="48"/>
        {/* Eiffel tower */}
        <Polygon points="180,140 168,80 174,80 168,40 178,18 188,40 182,80 188,80 196,140"/>
        <Rect x="170" y="90"  width="22"  height="3"/>
        <Rect x="172" y="70"  width="18"  height="2"/>
        <Rect x="220" y="92"  width="60"  height="48"/>
        <Rect x="280" y="100" width="80"  height="40"/>
      </G>
    </Svg>
  );
}

/** Returns the city cover key for a destination string, or null for generic gradient. */
export function getCoverKey(city: string): 'tokyo' | 'iceland' | 'paris' | null {
  const c = city.toLowerCase();
  if (c.includes('tokyo') || c.includes('japan')) return 'tokyo';
  if (c.includes('iceland') || c.includes('reykjavik')) return 'iceland';
  if (c.includes('paris') || c.includes('france')) return 'paris';
  return null;
}

/** Renders the matching city silhouette, or nothing for unconfigured cities. */
export function CitySilhouette({city}: {city: string}) {
  const key = getCoverKey(city);
  if (key === 'tokyo')   return <TokyoCover/>;
  if (key === 'iceland') return <IcelandCover/>;
  if (key === 'paris')   return <ParisCover/>;
  return null;
}
