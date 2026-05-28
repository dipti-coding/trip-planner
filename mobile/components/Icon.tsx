import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {colors} from '../theme';

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  color?: string;
}

export default function Icon({name, size = 20, stroke = 1.6, color = colors.textPrimary}: IconProps) {
  const dim = {width: size, height: size, viewBox: '0 0 24 24'} as const;
  const lc = 'round' as const;
  const lj = 'round' as const;
  const sw = stroke;

  // Stroke-only path
  const p = (d: string) => (
    <Path d={d} stroke={color} fill="none" strokeWidth={sw} strokeLinecap={lc} strokeLinejoin={lj}/>
  );
  // Stroke-only circle
  const sc = (cx: number, cy: number, r: number) => (
    <Circle cx={cx} cy={cy} r={r} stroke={color} fill="none" strokeWidth={sw}/>
  );
  // Stroke-only rect
  const sr = (x: number, y: number, w: number, h: number, rx = 0) => (
    <Rect x={x} y={y} width={w} height={h} rx={rx} stroke={color} fill="none" strokeWidth={sw} strokeLinecap={lc} strokeLinejoin={lj}/>
  );

  switch (name) {
    case 'home':
      return <Svg {...dim}>{p('M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z')}</Svg>;
    case 'compass':
      return <Svg {...dim}>{sc(12,12,9)}{p('M16 8l-2 6-6 2 2-6z')}</Svg>;
    case 'doc':
      return <Svg {...dim}>{p('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z')}{p('M14 3v5h5')}</Svg>;
    case 'user':
      return <Svg {...dim}>{sc(12,8,4)}{p('M4 21c0-4 4-7 8-7s8 3 8 7')}</Svg>;
    case 'plus':
      return <Svg {...dim}>{p('M12 5v14M5 12h14')}</Svg>;
    case 'search':
      return <Svg {...dim}>{sc(11,11,7)}{p('M20 20l-3-3')}</Svg>;
    case 'chev-right':
      return <Svg {...dim}>{p('M9 6l6 6-6 6')}</Svg>;
    case 'chev-left':
      return <Svg {...dim}>{p('M15 6l-6 6 6 6')}</Svg>;
    case 'chev-down':
      return <Svg {...dim}>{p('M6 9l6 6 6-6')}</Svg>;
    case 'plane':
      return <Svg {...dim}>{p('M3.2 13.2l3 1 4.5-4.5L4 5.4l1.3-1.3 8.2 3.2 4-4a2 2 0 0 1 2.8 2.8l-4 4 3.2 8.2-1.3 1.3-4.3-6.7-4.5 4.5 1 3-1.2 1.2-2.4-3.6L3 16.6z')}</Svg>;
    case 'hotel':
      return <Svg {...dim}>{p('M3 21V8h18v13M3 13h18M7 8V5h10v3')}</Svg>;
    case 'fork':
      return <Svg {...dim}>{p('M7 2v8a3 3 0 0 0 6 0V2M10 2v20M16 2v8h3v12')}</Svg>;
    case 'map-pin':
      return <Svg {...dim}>{p('M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z')}{sc(12,10,2.5)}</Svg>;
    case 'calendar':
      return <Svg {...dim}>{sr(3,5,18,16,2)}{p('M3 10h18M8 3v4M16 3v4')}</Svg>;
    case 'clock':
      return <Svg {...dim}>{sc(12,12,9)}{p('M12 7v5l3 2')}</Svg>;
    case 'share':
      return <Svg {...dim}>{sc(6,12,2.5)}{sc(18,6,2.5)}{sc(18,18,2.5)}{p('M8 11l8-4M8 13l8 4')}</Svg>;
    case 'more':
      return (
        <Svg {...dim}>
          <Circle cx="5"  cy="12" r="1.4" fill={color} stroke="none"/>
          <Circle cx="12" cy="12" r="1.4" fill={color} stroke="none"/>
          <Circle cx="19" cy="12" r="1.4" fill={color} stroke="none"/>
        </Svg>
      );
    case 'edit':
      return <Svg {...dim}>{p('M4 20h4L20 8l-4-4L4 16zM14 6l4 4')}</Svg>;
    case 'wallet':
      return <Svg {...dim}>{sr(3,6,18,14,2)}{p('M16 13h3M3 10h18')}</Svg>;
    case 'globe':
      return <Svg {...dim}>{sc(12,12,9)}{p('M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18')}</Svg>;
    case 'bell':
      return <Svg {...dim}>{p('M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4z')}{p('M10 20a2 2 0 0 0 4 0')}</Svg>;
    case 'star':
      return <Svg {...dim}>{p('M12 3l2.7 5.6 6.3.9-4.5 4.3 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.5l6.3-.9z')}</Svg>;
    case 'check':
      return <Svg {...dim}>{p('M5 12l4 4 10-10')}</Svg>;
    case 'x':
      return <Svg {...dim}>{p('M6 6l12 12M6 18L18 6')}</Svg>;
    case 'sun':
      return <Svg {...dim}>{sc(12,12,4)}{p('M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1')}</Svg>;
    case 'cloud':
      return <Svg {...dim}>{p('M7 18a4 4 0 1 1 1-7.9A6 6 0 0 1 20 12a4 4 0 0 1-1 7.9z')}</Svg>;
    case 'rain':
      return <Svg {...dim}>{p('M7 14a4 4 0 1 1 1-7.9A6 6 0 0 1 20 8a4 4 0 0 1-1 7.9zM9 17v3M13 17v3M17 17v2')}</Svg>;
    case 'snow':
      return <Svg {...dim}>{p('M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6')}</Svg>;
    case 'moon':
      return <Svg {...dim}>{p('M21 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10z')}</Svg>;
    case 'wand':
      return <Svg {...dim}>{p('M4 20l11-11M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.7 1.4 1.3.6-1.3.6L19 15l-.7-1.4-1.3-.6 1.3-.6z')}</Svg>;
    case 'apple':
      return (
        <Svg {...dim}>
          <Path
            fill={color} stroke="none"
            d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.7-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.5 1.3-.1 1.8-.9 3.4-.9s2 .9 3.4.9 2.3-1.2 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4zM14 5.4c.7-.8 1.2-2 1-3.2-1 0-2.3.7-3 1.5-.7.7-1.3 1.9-1.1 3 1.2.1 2.3-.6 3.1-1.3z"
          />
        </Svg>
      );
    case 'arrow-right':
      return <Svg {...dim}>{p('M5 12h14M13 6l6 6-6 6')}</Svg>;
    case 'arrow-up-right':
      return <Svg {...dim}>{p('M7 17L17 7M8 7h9v9')}</Svg>;
    case 'eye':
      return <Svg {...dim}>{p('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z')}{sc(12,12,3)}</Svg>;
    case 'film':
      return <Svg {...dim}>{sr(3,4,18,16,2)}{p('M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4')}</Svg>;
    case 'flag':
      return <Svg {...dim}>{p('M5 21V4M5 4h12l-2 4 2 4H5')}</Svg>;
    case 'route':
      return <Svg {...dim}>{sc(6,19,2)}{sc(18,5,2)}{p('M6 17V9a4 4 0 0 1 4-4h4M18 7v8a4 4 0 0 1-4 4h-4')}</Svg>;
    default:
      return <Svg {...dim}/>;
  }
}
