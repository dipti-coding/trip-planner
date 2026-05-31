/**
 * SVG cover illustrations keyed to destination type.
 * Each component fills its parent absolutely — use inside a positioned View.
 * preserveAspectRatio="xMidYMid slice" matches cover-image behaviour: fills
 * without distortion, crops symmetrically if the container is narrower than 360.
 */
import React, {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type {DestinationType} from '../utils/destinations';

// ─── City ────────────────────────────────────────────────────────────────────

function CityCover() {
  const id = useMemo(() => 'wc' + Math.random().toString(36).slice(2, 6), []);
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice">
      <Defs>
        {/* Morning sky — clear blue at top, warm peach/gold at horizon */}
        <LinearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#5BA3D9" />
          <Stop offset="45%" stopColor="#F4A96A" />
          <Stop offset="75%" stopColor="#FBCF7A" />
          <Stop offset="100%" stopColor="#FDE8A8" />
        </LinearGradient>
        {/* Sun radial glow */}
        <RadialGradient id={id + 'sun'} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF0A0" />
          <Stop offset="50%" stopColor="#FFCC44" />
          <Stop offset="100%" stopColor="#FFCC44" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="360" height="140" fill={`url(#${id}sky)`} />
      {/* Rising sun — low on horizon */}
      <Circle cx="64" cy="88" r="42" fill={`url(#${id}sun)`} opacity="0.7" />
      <Circle cx="64" cy="88" r="18" fill="#FFE066" opacity="0.9" />
      {/* Haze band at horizon */}
      <Rect x="0" y="72" width="360" height="18" fill="rgba(255,220,140,0.25)" />
      {/* Far buildings — warm blue-gray, clearly silhouetted */}
      <G fill="#3A5A7A">
        <Rect x="0" y="86" width="28" height="54"/><Rect x="30" y="76" width="16" height="64"/>
        <Rect x="48" y="88" width="24" height="52"/><Rect x="74" y="72" width="18" height="68"/>
        <Rect x="94" y="82" width="22" height="58"/><Rect x="118" y="68" width="14" height="72"/>
        <Rect x="134" y="80" width="28" height="60"/><Rect x="164" y="74" width="16" height="66"/>
        <Rect x="182" y="88" width="22" height="52"/><Rect x="206" y="64" width="18" height="76"/>
        <Rect x="226" y="78" width="24" height="62"/><Rect x="252" y="84" width="16" height="56"/>
        <Rect x="270" y="72" width="26" height="68"/><Rect x="298" y="82" width="20" height="58"/>
        <Rect x="320" y="76" width="22" height="64"/><Rect x="344" y="88" width="16" height="52"/>
      </G>
      {/* Near buildings — darker, strong silhouette */}
      <G fill="#243648">
        <Rect x="8" y="94" width="20" height="46"/><Rect x="52" y="92" width="18" height="48"/>
        <Rect x="100" y="88" width="22" height="52"/>
        <Polygon points="138,140 146,66 154,140"/>
        <Rect x="176" y="90" width="28" height="50"/><Rect x="216" y="86" width="20" height="54"/>
        <Rect x="246" y="92" width="16" height="48"/>
        <Polygon points="272,140 280,70 284,68 288,70 292,140"/>
        <Rect x="312" y="88" width="24" height="52"/><Rect x="338" y="92" width="22" height="48"/>
      </G>
      {/* Warm lit windows — a few early risers */}
      <G fill="#FFE080" opacity="0.85">
        <Rect x="18" y="97" width="3" height="2"/><Rect x="57" y="101" width="2" height="2"/>
        <Rect x="109" y="91" width="3" height="2"/><Rect x="186" y="93" width="3" height="2"/>
        <Rect x="186" y="99" width="3" height="2"/><Rect x="219" y="89" width="2" height="2"/>
        <Rect x="321" y="91" width="3" height="2"/><Rect x="341" y="95" width="3" height="2"/>
      </G>
      {/* Sun-kissed window glints */}
      <G fill="#FFFFFF" opacity="0.4">
        <Rect x="12" y="97" width="2" height="1"/><Rect x="103" y="91" width="2" height="1"/>
        <Rect x="179" y="93" width="2" height="1"/><Rect x="315" y="91" width="2" height="1"/>
      </G>
    </Svg>
  );
}

// ─── Beach ────────────────────────────────────────────────────────────────────

function BeachCover() {
  const id = useMemo(() => 'wb' + Math.random().toString(36).slice(2, 6), []);
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FEF3C7" />
          <Stop offset="38%" stopColor="#7DD3FC" />
          <Stop offset="72%" stopColor="#0284C7" />
          <Stop offset="100%" stopColor="#0369A1" />
        </LinearGradient>
        <RadialGradient id={id + 'sun'} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FDE68A" />
          <Stop offset="50%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="360" height="140" fill={`url(#${id}sky)`} />
      {/* Sun halo + disc */}
      <Circle cx="288" cy="36" r="34" fill={`url(#${id}sun)`} opacity="0.65" />
      <Circle cx="288" cy="36" r="15" fill="#FDE68A" />
      {/* Horizon shimmer */}
      <Rect x="0" y="72" width="360" height="8" fill="rgba(255,255,255,0.14)" />
      {/* Water */}
      <Rect x="0" y="78" width="360" height="62" fill="#0284C7" />
      {/* Waves */}
      <Path d="M0 85 Q45 79,90 85 T180 85 T270 85 T360 85 L360 91 L0 91 Z" fill="rgba(255,255,255,0.26)" />
      <Path d="M0 97 Q55 91,110 97 T220 97 T360 97 L360 104 L0 104 Z" fill="rgba(255,255,255,0.2)" />
      <Path d="M0 109 Q60 103,120 109 T240 109 T360 109 L360 117 L0 117 Z" fill="rgba(255,255,255,0.42)" />
      {/* Sandy shore */}
      <Path d="M0 117 Q90 113,180 117 T360 114 L360 140 L0 140 Z" fill="#D4A044" />
      <Rect x="0" y="125" width="360" height="15" fill="#C4913A" />
      {/* Sand ripples */}
      <Path d="M20 129 Q60 127,100 129" stroke="rgba(0,0,0,0.07)" strokeWidth="0.8" fill="none" />
      <Path d="M120 131 Q160 129,200 131" stroke="rgba(0,0,0,0.07)" strokeWidth="0.8" fill="none" />
      <Path d="M220 128 Q260 126,300 128" stroke="rgba(0,0,0,0.07)" strokeWidth="0.8" fill="none" />
    </Svg>
  );
}

// ─── Island ───────────────────────────────────────────────────────────────────

function IslandCover() {
  const id = useMemo(() => 'wi' + Math.random().toString(36).slice(2, 6), []);
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#BAE6FD" />
          <Stop offset="55%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0EA5E9" />
        </LinearGradient>
        <LinearGradient id={id + 'sea'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#0891B2" />
          <Stop offset="100%" stopColor="#0E7490" />
        </LinearGradient>
      </Defs>
      <Rect width="360" height="140" fill={`url(#${id}sky)`} />
      {/* Sea */}
      <Rect x="0" y="90" width="360" height="50" fill={`url(#${id}sea)`} />
      {/* Sea shimmer */}
      <Path d="M0 96 Q90 91,180 96 T360 93" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
      <Path d="M0 106 Q90 101,180 106 T360 103" stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none" />
      {/* Island main hill */}
      <Path d="M30 114 Q80 54,160 64 Q220 72,264 62 Q306 54,336 90 Q350 110,360 116 L360 140 L30 140 Z" fill="#065F46" />
      {/* Lighter foliage band */}
      <Path d="M70 98 Q130 62,182 68 Q234 74,270 64 Q304 56,328 82" stroke="#047857" strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.45" />
      {/* Highlight edge */}
      <Path d="M100 90 Q155 65,192 72 Q232 78,264 66" stroke="#D1FAE5" strokeWidth="1.8" fill="none" opacity="0.38" />
      {/* Palm 1 */}
      <G transform="translate(132,64)">
        <Path d="M0 44 Q2 22,4 0" stroke="#92400E" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        <Ellipse cx="-11" cy="-1" rx="17" ry="5" fill="#047857" transform="rotate(-22)" opacity="0.9" />
        <Ellipse cx="11" cy="-4" rx="15" ry="5" fill="#065F46" transform="rotate(16)" opacity="0.9" />
        <Ellipse cx="0" cy="-13" rx="13" ry="5" fill="#047857" transform="rotate(-6)" opacity="0.85" />
      </G>
      {/* Palm 2 */}
      <G transform="translate(234,57)">
        <Path d="M0 42 Q-2 20,2 0" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
        <Ellipse cx="-13" cy="0" rx="15" ry="4" fill="#065F46" transform="rotate(-26)" opacity="0.9" />
        <Ellipse cx="9" cy="-5" rx="14" ry="5" fill="#047857" transform="rotate(13)" opacity="0.9" />
        <Ellipse cx="2" cy="-14" rx="12" ry="4" fill="#065F46" transform="rotate(-9)" opacity="0.85" />
      </G>
      {/* Waterline foam */}
      <Path d="M30 114 Q100 108,160 112 T336 110" stroke="rgba(255,255,255,0.48)" strokeWidth="2" fill="none" />
    </Svg>
  );
}

// ─── Mountain ─────────────────────────────────────────────────────────────────

function MountainCover() {
  const id = useMemo(() => 'wm' + Math.random().toString(36).slice(2, 6), []);
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1E1B4B" />
          <Stop offset="52%" stopColor="#312E81" />
          <Stop offset="100%" stopColor="#4338CA" />
        </LinearGradient>
        <LinearGradient id={id + 'aur'} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#6EE7B7" stopOpacity="0" />
          <Stop offset="30%" stopColor="#6EE7B7" stopOpacity="0.18" />
          <Stop offset="62%" stopColor="#A78BFA" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width="360" height="140" fill={`url(#${id}sky)`} />
      {/* Aurora */}
      <Rect x="0" y="28" width="360" height="26" fill={`url(#${id}aur)`} />
      {/* Stars */}
      {([[30,14,0.8],[70,8,0.65],[122,18,0.7],[182,10,0.55],[222,16,0.7],[262,7,0.65],[312,13,0.75],[50,24,0.5],[344,22,0.6]] as [number,number,number][]).map(([x,y,o],i) => (
        <Circle key={i} cx={x} cy={y} r="0.8" fill="white" opacity={o} />
      ))}
      {/* Back range */}
      <Path d="M0 112 L58 54 L108 92 L158 40 L218 84 L268 47 L318 80 L360 56 L360 140 L0 140 Z" fill="#3730A3" opacity="0.62" />
      {/* Mid range */}
      <Path d="M0 132 L48 74 L98 107 L158 52 L218 92 L278 50 L328 88 L360 70 L360 140 L0 140 Z" fill="#2D2A87" />
      {/* Snow on mid peaks */}
      <G fill="white" opacity="0.72">
        <Polygon points="158,52 146,74 170,74" />
        <Polygon points="278,50 266,72 290,72" />
      </G>
      {/* Front range */}
      <Path d="M0 140 L0 110 L38 80 L88 116 L128 67 L188 112 L238 62 L298 102 L348 74 L360 82 L360 140 Z" fill="#1E1B4B" />
      {/* Snow on front peaks */}
      <G fill="white" opacity="0.88">
        <Polygon points="128,67 117,86 140,86" />
        <Polygon points="238,62 226,82 250,82" />
        <Polygon points="348,74 338,90 360,90" />
      </G>
      <Rect x="0" y="133" width="360" height="7" fill="#18174A" />
    </Svg>
  );
}

// ─── Nature ───────────────────────────────────────────────────────────────────

function NatureCover() {
  const id = useMemo(() => 'wn' + Math.random().toString(36).slice(2, 6), []);
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#BAE6FD" />
          <Stop offset="52%" stopColor="#7DD3FC" />
          <Stop offset="100%" stopColor="#38BDF8" />
        </LinearGradient>
      </Defs>
      <Rect width="360" height="140" fill={`url(#${id}sky)`} />
      {/* Mist at horizon */}
      <Rect x="0" y="68" width="360" height="22" fill="rgba(255,255,255,0.32)" />
      {/* Back hills */}
      <Path d="M0 102 Q58 74,118 92 Q178 110,238 80 Q298 60,360 87 L360 140 L0 140 Z" fill="#166534" opacity="0.68" />
      {/* Mid hills */}
      <Path d="M0 122 Q48 92,108 107 Q168 122,218 97 Q272 74,328 102 L360 110 L360 140 L0 140 Z" fill="#15803D" />
      {/* Back conifers */}
      <G fill="#14532D" opacity="0.65">
        {([[38,100],[88,90],[198,84],[278,92],[328,88]] as [number,number][]).map(([x,y],i) => (
          <G key={i}>
            <Polygon points={`${x},${y+16} ${x-7},${y+16} ${x},${y}`} />
            <Polygon points={`${x},${y+8} ${x-9},${y+14} ${x+9},${y+14}`} />
            <Polygon points={`${x},${y} ${x-7},${y+8} ${x+7},${y+8}`} />
          </G>
        ))}
      </G>
      {/* Front forest floor */}
      <Path d="M0 132 Q60 124,120 130 Q180 136,240 126 Q300 116,360 128 L360 140 L0 140 Z" fill="#14532D" />
      {/* Front conifers */}
      <G fill="#166534">
        {([[18,118],[68,112],[148,108],[228,114],[308,110],[352,116]] as [number,number][]).map(([x,y],i) => (
          <G key={i}>
            <Polygon points={`${x},${y+18} ${x-8},${y+18} ${x},${y}`} />
            <Polygon points={`${x},${y+10} ${x-10},${y+16} ${x+10},${y+16}`} />
            <Polygon points={`${x},${y+2} ${x-8},${y+10} ${x+8},${y+10}`} />
          </G>
        ))}
      </G>
      {/* Undergrowth highlight */}
      <Path d="M0 134 Q60 130,120 134 T240 132 T360 134" stroke="#22C55E" strokeWidth="2.2" fill="none" opacity="0.3" />
    </Svg>
  );
}

// ─── Historical ───────────────────────────────────────────────────────────────

function HistoricalCover() {
  const id = useMemo(() => 'wh' + Math.random().toString(36).slice(2, 6), []);
  const columnXs = [94, 122, 150, 178, 206, 234, 262];
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FEF3C7" />
          <Stop offset="32%" stopColor="#FCD34D" />
          <Stop offset="68%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
        <RadialGradient id={id + 'sun'} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FDE68A" stopOpacity="0.85" />
          <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="360" height="140" fill={`url(#${id}sky)`} />
      {/* Sun glow */}
      <Circle cx="180" cy="46" r="44" fill={`url(#${id}sun)`} />
      <Circle cx="180" cy="46" r="14" fill="#FDE68A" />
      {/* Ground */}
      <Rect x="0" y="112" width="360" height="28" fill="#7C2D12" />
      <Rect x="0" y="120" width="360" height="20" fill="#6B1F0E" />
      {/* Steps */}
      <Rect x="56" y="110" width="248" height="4" fill="#92400E" />
      <Rect x="68" y="106" width="224" height="4" fill="#9A4510" />
      <Rect x="80" y="102" width="200" height="4" fill="#A0490E" />
      {/* Columns */}
      <G fill="#92400E">
        {columnXs.map((x, i) => (
          <Rect key={i} x={x} y={42} width={14} height={60} rx={1} />
        ))}
      </G>
      {/* Column capitals */}
      <G fill="#A16207">
        {columnXs.map((x, i) => (
          <Rect key={i} x={x - 2} y={40} width={18} height={5} rx={1} />
        ))}
      </G>
      {/* Column bases */}
      <G fill="#78350F">
        {columnXs.map((x, i) => (
          <Rect key={i} x={x - 1} y={97} width={16} height={5} />
        ))}
      </G>
      {/* Entablature */}
      <Rect x="84" y="35" width="196" height="9" fill="#A16207" />
      <Rect x="82" y="33" width="200" height="4" fill="#B45309" />
      {/* Pediment */}
      <Polygon points="84,33 280,33 182,4" fill="#92400E" />
      <Polygon points="98,33 266,33 182,10" fill="#A16207" opacity="0.55" />
      <Line x1="182" y1="4" x2="84" y2="33" stroke="#D97706" strokeWidth="1" opacity="0.45" />
      <Line x1="182" y1="4" x2="280" y2="33" stroke="#D97706" strokeWidth="1" opacity="0.45" />
      {/* Side walls */}
      <Rect x="0" y="68" width="50" height="72" fill="#7C2D12" opacity="0.65" />
      <Rect x="312" y="62" width="48" height="78" fill="#78350F" opacity="0.65" />
      {/* Ground haze */}
      <Rect x="0" y="100" width="360" height="16" fill="rgba(253,200,0,0.07)" />
    </Svg>
  );
}

// ─── Wander (catch-all) ───────────────────────────────────────────────────────
// Aerial sunset — window-seat view. Works for any destination type.

function WanderCover() {
  const id = useMemo(() => 'ww' + Math.random().toString(36).slice(2, 6), []);
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice">
      <Defs>
        {/* Sunset sky: deep violet → rose → orange → gold */}
        <LinearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#3B1F5E" />
          <Stop offset="32%" stopColor="#9B2742" />
          <Stop offset="62%" stopColor="#E8651A" />
          <Stop offset="100%" stopColor="#F9C44A" />
        </LinearGradient>
        {/* Sun glow */}
        <RadialGradient id={id + 'sun'} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF4A0" />
          <Stop offset="45%" stopColor="#FFCC44" />
          <Stop offset="100%" stopColor="#FFCC44" stopOpacity="0" />
        </RadialGradient>
        {/* Cloud layer gradient: white on top, fading to cloud-shadow cream */}
        <LinearGradient id={id + 'cloud'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFF8F0" />
          <Stop offset="100%" stopColor="#E8D0B8" />
        </LinearGradient>
      </Defs>
      <Rect width="360" height="140" fill={`url(#${id}sky)`} />
      {/* Sun disc + glow */}
      <Circle cx="180" cy="86" r="52" fill={`url(#${id}sun)`} opacity="0.75" />
      <Circle cx="180" cy="86" r="16" fill="#FFEE88" opacity="0.92" />
      {/* Horizon shimmer band */}
      <Rect x="0" y="80" width="360" height="10" fill="rgba(255,230,160,0.28)" />
      {/* Cloud floor — bumpy top edge, solid below */}
      <Path
        d="M0,92 Q22,78 44,88 Q66,72 88,84 Q110,68 132,80 Q154,66 176,78 Q198,64 220,77 Q242,66 264,80 Q286,70 308,82 Q330,72 352,84 L360,86 L360,140 L0,140 Z"
        fill={`url(#${id}cloud)`}
      />
      {/* Cloud puffs rising above the floor */}
      <G fill="#FFF8F0">
        <Circle cx="44" cy="84" r="14" />
        <Circle cx="62" cy="78" r="18" />
        <Circle cx="82" cy="82" r="13" />
        <Circle cx="176" cy="74" r="16" />
        <Circle cx="196" cy="68" r="20" />
        <Circle cx="216" cy="73" r="15" />
        <Circle cx="310" cy="78" r="13" />
        <Circle cx="328" cy="72" r="17" />
        <Circle cx="347" cy="76" r="12" />
      </G>
      {/* Subtle cloud shadow tint */}
      <G fill="#D4B090" opacity="0.3">
        <Circle cx="62" cy="78" r="18" />
        <Circle cx="196" cy="68" r="20" />
        <Circle cx="328" cy="72" r="17" />
      </G>
    </Svg>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function DestinationCover({type}: {type: DestinationType}) {
  switch (type) {
    case 'city':       return <CityCover />;
    case 'beach':      return <BeachCover />;
    case 'island':     return <IslandCover />;
    case 'mountain':   return <MountainCover />;
    case 'nature':     return <NatureCover />;
    case 'historical': return <HistoricalCover />;
    default:           return <WanderCover />;
  }
}
