import { useCallback, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CATEGORY_META, SLOTS_BY_CATEGORY } from '../data/components';
import {
  batteryToHours,
  calcDesignStats,
  cameraToMP,
  getAvailableComponents,
  getComponent,
} from '../lib/gameLogic';
import { useGameStore } from '../store/useGameStore';
import type { ComponentDef, ComponentSlot, DeviceCategory, DeviceStats, DraftDesign } from '../types';

const SLOT_META: Record<ComponentSlot, { label: string; icon: string; color: string; gradient: string }> = {
  screen:       { label: 'Screen',       icon: '🖥️', color: 'text-blue-400',   gradient: 'from-blue-500 to-cyan-500' },
  cpu:          { label: 'Processor',    icon: '⚡',  color: 'text-violet-400', gradient: 'from-violet-500 to-purple-500' },
  ram:          { label: 'RAM',          icon: '🧩', color: 'text-emerald-400',gradient: 'from-emerald-500 to-teal-500' },
  storage:      { label: 'Storage',      icon: '💾', color: 'text-amber-400',  gradient: 'from-amber-500 to-orange-500' },
  camera:       { label: 'Camera',       icon: '📷', color: 'text-pink-400',   gradient: 'from-pink-500 to-rose-500' },
  battery:      { label: 'Battery',      icon: '🔋', color: 'text-green-400',  gradient: 'from-green-500 to-lime-500' },
  chassis:      { label: 'Design',       icon: '📐', color: 'text-slate-300',  gradient: 'from-slate-400 to-zinc-400' },
  audio:        { label: 'Audio',        icon: '🎧', color: 'text-fuchsia-400',gradient: 'from-fuchsia-500 to-pink-500' },
  connectivity: { label: 'Connectivity', icon: '📡', color: 'text-sky-400',    gradient: 'from-sky-500 to-blue-500' },
};

const TIER_META: Record<number, { label: string; color: string; ring: string }> = {
  1: { label: 'Basic', color: 'bg-surface-hover text-muted', ring: 'ring-border' },
  2: { label: 'Mid-range', color: 'bg-blue-500/15 text-blue-400', ring: 'ring-blue-500/30' },
  3: { label: 'Premium', color: 'bg-purple-500/15 text-purple-400', ring: 'ring-purple-500/30' },
  4: { label: 'Flagship', color: 'bg-amber-500/15 text-amber-400', ring: 'ring-amber-500/30' },
};

function ComponentTierCard({
  component,
  isSelected,
  onDragStart,
  onClick,
}: {
  component: ComponentDef;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, comp: ComponentDef) => void;
  onClick: () => void;
}) {
  const tier = TIER_META[component.tier];
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, component)}
      onClick={onClick}
      className={`group relative cursor-grab rounded-xl border p-3 transition-all duration-200 active:cursor-grabbing ${
        isSelected
          ? `border-accent/50 bg-accent/10 ring-1 ${tier.ring} shadow-[0_0_20px_rgba(59,130,246,0.12)]`
          : 'border-border/50 bg-surface-raised/60 hover:border-border-bright hover:bg-surface-hover hover:shadow-lg'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-px -left-px h-2 w-2 rounded-br-lg rounded-tl-lg bg-accent" />
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg">{component.name}</span>
          {'craftedFrom' in component && (
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-purple-400">
              Crafted
            </span>
          )}
        </div>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${tier.color}`}>
          {tier.label}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.entries(component.stats).map(([stat, val]) => (
          <span key={stat} className="inline-flex items-center gap-0.5 rounded bg-surface-hover/80 px-1.5 py-0.5 text-[10px] text-muted">
            <span className="capitalize">{stat}</span>
            <span className="font-mono text-fg">+{val}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-success">${component.cost}</span>
        <span className="text-[10px] text-muted/50 opacity-0 transition group-hover:opacity-100">Drag →</span>
      </div>
    </div>
  );
}

const COLOR_PRESETS = [
  { name: 'Titanium Gray', hex: '#475569' },
  { name: 'Alpine Green', hex: '#2d4b3f' },
  { name: 'Deep Purple', hex: '#3b2f4c' },
  { name: 'Gold', hex: '#d4af37' },
  { name: 'Matte Black', hex: '#1c1c1e' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Neo Mint', hex: '#2ecc71' },
  { name: 'Cyberpunk Yellow', hex: '#f1c40f' },
  { name: 'Crimson Red', hex: '#c0392b' },
  { name: 'Electric Blue', hex: '#2980b9' },
];

const BOX_COLOR_PRESETS = [
  { name: 'Sleek Black', hex: '#0f172a' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Royal Gold', hex: '#d4af37' },
  { name: 'Craft Brown', hex: '#8b5a2b' },
  { name: 'Titanium Dark', hex: '#1e293b' },
];

const BOX_TEXT_PRESETS = [
  { name: 'Gold Foil', hex: '#d4af37' },
  { name: 'Silver Foil', hex: '#e2e8f0' },
  { name: 'Pitch Black', hex: '#0f172a' },
  { name: 'Soft White', hex: '#f8fafc' },
  { name: 'Electric Cyan', hex: '#06b6d4' },
];

const CAMERA_LAYOUTS = ['Single Lens', 'Vertical Dual', 'Square Triple', 'Ring Array', 'Circular'];
const FINISH_OPTIONS = ['Matte Glass', 'Brushed Titanium', 'Glossy Ceramic', 'Eco-Leather', 'Carbon Fiber', 'Stellar Glitter', 'Matte Plastic'];
const LOGO_OPTIONS = ['Circle', 'Apple', 'Star', 'Leaf', 'Delta', 'Orb', 'Helix', 'Apex', 'Square'];
const BOX_STYLES = ['Minimalist', 'Premium', 'Bold'];

const NOTCH_STYLES = ['Punch Hole', 'Waterdrop', 'Dynamic Island', 'Bezelless'];
const CURVATURE_OPTIONS = ['Flat', 'Curved'];
const BEZEL_SIZES = ['Bezel-less', 'Thin', 'Standard', 'Thick'];
const BUTTON_STYLES = ['Classic', 'Pill', 'Accent'];
const STRAP_TYPES = ['Sport', 'Leather', 'Milanese'];

const SMARTWATCH_SHAPES = ['Square', 'Round'];
const LOGO_GLOW_OPTIONS = ['None', 'White', 'Accent', 'Rainbow'];
const CAMERA_SHAPES = ['Circular', 'Square', 'Pill', 'Integrated'];
const BUTTON_PLACEMENTS = ['Right Side', 'Left Side', 'Both Sides', 'Top Edge'];

const STRAP_COLOR_PRESETS = [
  { name: 'Matte Black', hex: '#1c1c1e' },
  { name: 'Apple Orange', hex: '#f97316' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Forest Green', hex: '#064e3b' },
  { name: 'Mist Gray', hex: '#94a3b8' },
];

const BACKLIGHT_PRESETS = [
  { name: 'Electric Cyan', hex: '#06b6d4' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Toxic Green', hex: '#22c55e' },
  { name: 'Neon Violet', hex: '#a855f7' },
  { name: 'Sunset Orange', hex: '#f97316' },
];

const LOGO_MAP: Record<string, string> = {
  Circle: '🟢',
  Apple: '🍎',
  Star: '⭐',
  Leaf: '🍃',
  Delta: '🔺',
  Orb: '🪐',
  Helix: '🌀',
  Apex: '⚡',
  Square: '⏹️',
};

const renderNotch = (style: string) => {
  switch (style) {
    case 'Punch Hole':
      return (
        <div className="relative z-10 flex justify-center pt-2 pb-1 bg-black/5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-800/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-indigo-900/50" />
          </div>
        </div>
      );
    case 'Waterdrop':
      return (
        <div className="relative z-10 flex justify-center bg-black/5">
          <div className="w-6 h-3 bg-zinc-950 rounded-b-xl border-x border-b border-zinc-800/40 relative -top-px flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          </div>
        </div>
      );
    case 'Dynamic Island':
      return (
        <div className="relative z-10 flex justify-center pt-2 pb-1 bg-black/5">
          <div className="w-16 h-4 bg-zinc-950 rounded-full border border-zinc-800/50 shadow-md flex items-center justify-between px-2">
            <div className="w-1 h-1 rounded-full bg-green-500/80 animate-pulse" />
            <div className="text-[6px] font-semibold text-zinc-500 font-mono tracking-tighter">9:41</div>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          </div>
        </div>
      );
    case 'Bezelless':
    default:
      return (
        <div className="relative z-10 pt-2 pb-1" />
      );
  }
};

const renderWatchStraps = (type: string, color: string) => {
  const strapPattern = type === 'Milanese'
    ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)'
    : type === 'Leather'
      ? 'linear-gradient(to right, rgba(0,0,0,0.15), transparent 15%, transparent 85%, rgba(0,0,0,0.15))'
      : 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 8px, transparent 8px, transparent 16px)';

  return (
    <>
      <div
        className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-20 rounded-t-2xl shadow-lg border-x border-t border-white/10 z-[-1] transition-all duration-300"
        style={{
          backgroundColor: color,
          backgroundImage: strapPattern,
          boxShadow: '0 -4px 10px rgba(0,0,0,0.5)'
        }}
      />
      <div
        className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-28 h-20 rounded-b-2xl shadow-lg border-x border-b border-white/10 z-[-1] transition-all duration-300"
        style={{
          backgroundColor: color,
          backgroundImage: strapPattern,
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}
      />
    </>
  );
};

const renderLaptopDeck = (backlightColor: string) => {
  return (
    <div
      className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-72 h-8 bg-zinc-800 rounded-b-md border-t border-zinc-700/60 shadow-2xl flex flex-col justify-end p-1 z-[-1]"
      style={{
        boxShadow: `0 8px 25px rgba(0,0,0,0.8), 0 0 12px ${backlightColor}40`
      }}
    >
      <div className="w-16 h-3 bg-zinc-900 rounded mx-auto border border-zinc-800/80 mb-0.5" />
      <div className="flex justify-between px-4 gap-0.5">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-sm transition-all duration-300"
            style={{ backgroundColor: backlightColor, opacity: 0.6, boxShadow: `0 0 4px ${backlightColor}` }}
          />
        ))}
      </div>
    </div>
  );
};

const getFinishStyles = (color: string, finish: string): React.CSSProperties => {
  switch (finish) {
    case 'Brushed Titanium':
      return {
        backgroundColor: color,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 4px), linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%)',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
      };
    case 'Glossy Ceramic':
      return {
        backgroundColor: color,
        backgroundImage: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.25) 50%, transparent 55%), linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0.3))',
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.2), 0 4px 20px rgba(0,0,0,0.5)',
      };
    case 'Eco-Leather':
      return {
        backgroundColor: color,
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px), radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
        backgroundPosition: '0 0, 2px 2px',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6), inset 0 0 5px rgba(0,0,0,0.4)',
      };
    case 'Carbon Fiber':
      return {
        backgroundColor: '#151515',
        backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)',
        backgroundSize: '10px 10px',
        backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.05)',
      };
    case 'Stellar Glitter':
      return {
        backgroundColor: color,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1.5px)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 8px 8px',
        boxShadow: 'inset 0 0 12px rgba(255,255,255,0.15), inset 0 -2px 6px rgba(0,0,0,0.4)',
      };
    case 'Matte Plastic':
      return {
        backgroundColor: color,
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(0,0,0,0.15))',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.25)',
      };
    case 'Matte Glass':
    default:
      return {
        backgroundColor: color,
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.12), transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0.2))',
        boxShadow: 'inset 0 0 12px rgba(255,255,255,0.08), inset 0 -2px 6px rgba(0,0,0,0.3)',
      };
  }
};

const renderCameraModule = (layout: string, shape: string = 'Integrated') => {
  const lensStyle = "w-6 h-6 rounded-full bg-black flex items-center justify-center relative overflow-hidden border border-zinc-700/50 shadow-inner";
  const lensGlassStyle = "absolute inset-0.5 rounded-full bg-gradient-to-tr from-cyan-600/30 to-zinc-900 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-1.5 after:h-1.5 after:rounded-full after:bg-white/60";
  const flashStyle = "w-2.5 h-2.5 rounded-full bg-amber-200/90 border border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]";

  let containerStyle = "absolute top-4 left-4 bg-black/35 backdrop-blur-md border border-white/10 p-2 shadow-lg transition-all duration-300 z-10 ";
  if (shape === 'Circular') {
    containerStyle += "rounded-full flex flex-col items-center justify-center gap-1.5 w-18 h-18";
  } else if (shape === 'Square') {
    containerStyle += "rounded-2xl grid grid-cols-2 gap-1.5 w-18 h-18 items-center justify-items-center";
  } else if (shape === 'Pill') {
    containerStyle += "rounded-full flex flex-col items-center gap-1.5 w-10 py-3";
  } else { // Integrated (no bump)
    containerStyle = "absolute top-4 left-4 flex flex-col gap-2 transition-all duration-300 z-10";
  }

  const isIntegrated = shape === 'Integrated';

  switch (layout) {
    case 'Single Lens':
      return isIntegrated ? (
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <div className={`${lensStyle} ring-2 ring-white/10`}>
            <div className={lensGlassStyle} />
          </div>
          <div className={flashStyle} />
        </div>
      ) : (
        <div className={`${containerStyle} flex items-center gap-2 w-auto h-auto`}>
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
          <div className={flashStyle} />
        </div>
      );
    case 'Vertical Dual':
      return isIntegrated ? (
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <div className={`${lensStyle} ring-2 ring-white/10`}>
            <div className={lensGlassStyle} />
          </div>
          <div className={`${lensStyle} ring-2 ring-white/10`}>
            <div className={lensGlassStyle} />
          </div>
          <div className={`${flashStyle} self-center`} />
        </div>
      ) : (
        <div className={`${containerStyle} ${shape !== 'Pill' ? 'w-10 flex flex-col items-center py-2' : ''}`}>
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
          <div className={flashStyle} />
        </div>
      );
    case 'Square Triple':
      return isIntegrated ? (
        <div className="absolute top-4 left-4 grid grid-cols-2 gap-2 z-10">
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
          <div className={`${flashStyle} self-center justify-self-center`} />
        </div>
      ) : (
        <div className={`${containerStyle} ${shape !== 'Square' ? 'grid grid-cols-2 gap-2 w-16 h-16 items-center justify-items-center rounded-2xl' : ''}`}>
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
          <div className={flashStyle} />
        </div>
      );
    case 'Ring Array':
      return isIntegrated ? (
        <div className="absolute top-4 left-4 grid grid-cols-2 gap-2 z-10">
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
          <div className={flashStyle} />
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
        </div>
      ) : (
        <div className={`${containerStyle} ${shape !== 'Square' ? 'grid grid-cols-2 gap-2 w-16 h-16 items-center justify-items-center rounded-2xl' : ''}`}>
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
          <div className={flashStyle} />
          <div className={lensStyle}>
            <div className={lensGlassStyle} />
          </div>
        </div>
      );
    case 'Circular':
    default:
      return isIntegrated ? (
        <div className="absolute top-4 left-4 flex gap-1.5 items-center z-10">
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
          <div className={`${lensStyle} ring-2 ring-white/10`}><div className={lensGlassStyle} /></div>
        </div>
      ) : (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/35 backdrop-blur-md border border-white/15 rounded-full p-3.5 flex items-center justify-center shadow-2xl w-22 h-22 z-10">
          <div className="w-full h-full rounded-full border border-white/10 relative flex items-center justify-center bg-zinc-900/60">
            <div className={`${lensStyle} absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4`}>
              <div className={lensGlassStyle} />
            </div>
            <div className={`${lensStyle} absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-4`}>
              <div className={lensGlassStyle} />
            </div>
            <div className={`${lensStyle} absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4`}>
              <div className={lensGlassStyle} />
            </div>
            <div className={`${flashStyle} absolute right-2 top-1/2 -translate-y-1/2`} />
          </div>
        </div>
      );
  }
};

const renderBoxStyle = (style: string, name: string, logo: string, textColor: string) => {
  const logoSymbol = LOGO_MAP[logo] || '🟢';

  switch (style) {
    case 'Premium':
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center border border-white/5 rounded-3xl" style={{ color: textColor }}>
          <div className="w-14 h-14 rounded-full border border-dashed flex items-center justify-center mb-6" style={{ borderColor: textColor }}>
            <span className="text-2xl" style={{ filter: `drop-shadow(0 0 8px ${textColor}aa)` }}>{logoSymbol}</span>
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-current to-transparent mb-4" />
          <h4 className="text-xl font-serif tracking-widest font-bold capitalize mb-1">{name}</h4>
          <p className="text-[9px] tracking-[0.2em] opacity-60 uppercase">Edition Premium</p>
        </div>
      );
    case 'Bold':
      return (
        <div className="flex flex-col justify-between h-full p-6 text-left" style={{ color: textColor }}>
          <div className="text-4xl font-extrabold tracking-tighter opacity-80" style={{ textShadow: `2px 2px 0px ${textColor}30` }}>{logoSymbol}</div>
          <div className="mt-auto">
            <h4 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2 break-all" style={{ textShadow: `2px 2px 0px rgba(0,0,0,0.2)` }}>{name}</h4>
            <div className="inline-block px-1.5 py-0.5 bg-white/15 rounded text-[8px] font-bold tracking-widest uppercase">Next-Gen Spec</div>
          </div>
        </div>
      );
    case 'Minimalist':
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center" style={{ color: textColor }}>
          <span className="text-3xl mb-4 opacity-75">{logoSymbol}</span>
          <h4 className="text-base font-light tracking-[0.25em] uppercase truncate max-w-full">{name}</h4>
          <span className="text-[7px] tracking-[0.3em] opacity-40 uppercase mt-1">Packaged Product</span>
        </div>
      );
  }
};

function PhoneMockup({
  category,
  placedComponents,
  onDrop,
  onClearSlot,
  deviceName,
  stats,
  bodyColor,
  frameStyle,
  logoIcon,
  cameraLayout,
  boxColor,
  boxTextColor,
  boxStyle,
  notchStyle,
  screenCurvature,
  buttonColor,
  buttonStyle,
  bezelSize,
  strapType,
  strapColor,
  backlightColor,
  smartwatchShape,
  logoGlow,
  cameraShape,
  buttonPlacement,
}: {
  category: DeviceCategory;
  placedComponents: Partial<Record<ComponentSlot, string>>;
  onDrop: (slot: ComponentSlot, componentId: string) => void;
  onClearSlot: (slot: ComponentSlot) => void;
  deviceName: string;
  stats: DeviceStats;
  bodyColor: string;
  frameStyle: string;
  logoIcon: string;
  cameraLayout: string;
  boxColor: string;
  boxTextColor: string;
  boxStyle: string;
  notchStyle: string;
  screenCurvature: string;
  buttonColor: string;
  buttonStyle: string;
  bezelSize: string;
  strapType: string;
  strapColor: string;
  backlightColor: string;
  smartwatchShape: string;
  logoGlow: string;
  cameraShape: string;
  buttonPlacement: string;
}) {
  const [viewMode, setViewMode] = useState<'front' | 'back' | 'box'>('front');
  const [dragOverSlot, setDragOverSlot] = useState<ComponentSlot | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent, slot: ComponentSlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slot);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverSlot(null), []);

  const handleDrop = useCallback(
    (e: React.DragEvent, slot: ComponentSlot) => {
      e.preventDefault();
      const componentId = e.dataTransfer.getData('component-id');
      if (componentId) onDrop(slot, componentId);
      setDragOverSlot(null);
    },
    [onDrop],
  );

  const slots = SLOTS_BY_CATEGORY[category];
  const overallScore = Math.round(
    (stats.performance + stats.display + stats.camera + stats.battery + stats.build + stats.appeal) / 6,
  );

const getLogoGlowStyle = (glow: string, accentColor: string) => {
  const baseShadow = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))';
  switch (glow) {
    case 'White':
      return `${baseShadow} drop-shadow(0 0 12px rgba(255,255,255,0.85))`;
    case 'Accent':
      return `${baseShadow} drop-shadow(0 0 12px ${accentColor})`;
    case 'Rainbow':
      return `${baseShadow} drop-shadow(0 0 8px #f43f5e) drop-shadow(0 0 12px #3b82f6) drop-shadow(0 0 15px #10b981)`;
    case 'None':
    default:
      return baseShadow;
  }
};

  const getBezelPadding = (size: string, cat: string) => {
    const isWatch = cat === 'smartwatch';
    const isRound = isWatch && smartwatchShape === 'Round';
    if (isRound) {
      switch (size) {
        case 'Bezel-less': return 'p-[4px] rounded-full aspect-square';
        case 'Thin': return 'p-[12px] rounded-full aspect-square';
        case 'Standard': return 'p-[20px] rounded-full aspect-square';
        case 'Thick': return 'p-[32px] rounded-full aspect-square';
        default: return 'p-[20px] rounded-full aspect-square';
      }
    }
    switch (size) {
      case 'Bezel-less': return `p-[2px] ${isWatch ? 'rounded-[3.8rem]' : 'rounded-[2.3rem]'}`;
      case 'Thin': return `p-[6px] ${isWatch ? 'rounded-[3.6rem]' : 'rounded-[2.1rem]'}`;
      case 'Standard': return `p-[10px] ${isWatch ? 'rounded-[3.3rem]' : 'rounded-[2rem]'}`;
      case 'Thick': return `p-[15px] ${isWatch ? 'rounded-[3.0rem]' : 'rounded-[1.8rem]'}`;
      default: return `p-[10px] ${isWatch ? 'rounded-[3.3rem]' : 'rounded-[2rem]'}`;
    }
  };

  const getScreenRounding = (size: string, cat: string) => {
    const isWatch = cat === 'smartwatch';
    const isRound = isWatch && smartwatchShape === 'Round';
    if (isRound) return 'rounded-full aspect-square';
    switch (size) {
      case 'Bezel-less': return isWatch ? 'rounded-[3.7rem]' : 'rounded-[2.2rem]';
      case 'Thin': return isWatch ? 'rounded-[3.5rem]' : 'rounded-[2.0rem]';
      case 'Standard': return isWatch ? 'rounded-[3.1rem]' : 'rounded-[1.8rem]';
      case 'Thick': return isWatch ? 'rounded-[2.6rem]' : 'rounded-[1.5rem]';
      default: return isWatch ? 'rounded-[3.1rem]' : 'rounded-[1.8rem]';
    }
  };

  const bezelPaddingClass = getBezelPadding(bezelSize, category);
  const screenRoundingClass = getScreenRounding(bezelSize, category);

  const isCircularWatch = category === 'smartwatch' && smartwatchShape === 'Round';

  const frameRounded = isCircularWatch
    ? 'rounded-full aspect-square'
    : category === 'smartwatch'
      ? 'rounded-[4rem]'
      : 'rounded-[2.8rem]';

  const bezelRounded = isCircularWatch
    ? 'rounded-full aspect-square'
    : category === 'smartwatch'
      ? 'rounded-[3.5rem]'
      : 'rounded-[2rem]';

  const frameAspectClass = category === 'smartwatch' ? 'w-56 h-56 sm:w-64 sm:h-64 flex flex-col justify-center' : '';
  const screenMinHeightClass = category === 'smartwatch' ? 'min-h-[12rem] aspect-square flex flex-col justify-center py-2' : 'min-h-[28rem] px-3 pb-4 pt-2';

  const powerBtnColor = buttonStyle === 'Accent' ? '#f97316' : buttonColor;

  let powerBtnStyleClass = '';
  let volUpBtnStyleClass = '';
  let volDownBtnStyleClass = '';

  let powerBtnStyle: React.CSSProperties = {};
  let volUpBtnStyle: React.CSSProperties = {};
  let volDownBtnStyle: React.CSSProperties = {};

  if (buttonPlacement === 'Left Side') {
    powerBtnStyleClass = `absolute left-[-6px] top-28 w-1.5 h-8 transition-all shadow-md z-10`;
    powerBtnStyle = {
      backgroundColor: powerBtnColor,
      borderRadius: buttonStyle === 'Pill' ? '9999px 0 0 9999px' : '3px 0 0 3px',
      borderLeft: 'none'
    };
    volUpBtnStyleClass = `absolute right-[-6px] top-24 w-1.5 h-6 transition-all shadow-md z-10`;
    volUpBtnStyle = {
      backgroundColor: buttonColor,
      borderRadius: buttonStyle === 'Pill' ? '0 9999px 9999px 0' : '0 3px 3px 0',
      borderRight: 'none'
    };
    volDownBtnStyleClass = `absolute right-[-6px] top-32 w-1.5 h-6 transition-all shadow-md z-10`;
    volDownBtnStyle = {
      backgroundColor: buttonColor,
      borderRadius: buttonStyle === 'Pill' ? '0 9999px 9999px 0' : '0 3px 3px 0',
      borderRight: 'none'
    };
  } else if (buttonPlacement === 'Both Sides') {
    powerBtnStyleClass = `absolute right-[-6px] top-28 w-1.5 h-8 transition-all shadow-md z-10`;
    powerBtnStyle = {
      backgroundColor: powerBtnColor,
      borderRadius: buttonStyle === 'Pill' ? '0 9999px 9999px 0' : '0 3px 3px 0',
      borderRight: 'none'
    };
    volUpBtnStyleClass = `absolute left-[-6px] top-24 w-1.5 h-6 transition-all shadow-md z-10`;
    volUpBtnStyle = {
      backgroundColor: buttonColor,
      borderRadius: buttonStyle === 'Pill' ? '9999px 0 0 9999px' : '3px 0 0 3px',
      borderLeft: 'none'
    };
    volDownBtnStyleClass = `absolute left-[-6px] top-32 w-1.5 h-6 transition-all shadow-md z-10`;
    volDownBtnStyle = {
      backgroundColor: buttonColor,
      borderRadius: buttonStyle === 'Pill' ? '9999px 0 0 9999px' : '3px 0 0 3px',
      borderLeft: 'none'
    };
  } else if (buttonPlacement === 'Top Edge') {
    powerBtnStyleClass = `absolute top-[-6px] left-12 w-8 h-1.5 transition-all shadow-md z-10`;
    powerBtnStyle = {
      backgroundColor: powerBtnColor,
      borderRadius: buttonStyle === 'Pill' ? '9999px 9999px 0 0' : '3px 3px 0 0',
      borderTop: 'none'
    };
    volUpBtnStyleClass = `absolute top-[-6px] right-20 w-6 h-1.5 transition-all shadow-md z-10`;
    volUpBtnStyle = {
      backgroundColor: buttonColor,
      borderRadius: buttonStyle === 'Pill' ? '9999px 9999px 0 0' : '3px 3px 0 0',
      borderTop: 'none'
    };
    volDownBtnStyleClass = `absolute top-[-6px] right-12 w-6 h-1.5 transition-all shadow-md z-10`;
    volDownBtnStyle = {
      backgroundColor: buttonColor,
      borderRadius: buttonStyle === 'Pill' ? '9999px 9999px 0 0' : '3px 3px 0 0',
      borderTop: 'none'
    };
  } else {
    powerBtnStyleClass = `absolute right-[-6px] top-28 w-1.5 h-8 transition-all shadow-md z-10`;
    powerBtnStyle = {
      backgroundColor: powerBtnColor,
      borderRadius: buttonStyle === 'Pill' ? '0 9999px 9999px 0' : '0 3px 3px 0',
      borderRight: 'none'
    };
    volUpBtnStyleClass = `absolute left-[-6px] top-24 w-1.5 h-6 transition-all shadow-md z-10`;
    volUpBtnStyle = {
      backgroundColor: buttonColor,
      borderRadius: buttonStyle === 'Pill' ? '9999px 0 0 9999px' : '3px 0 0 3px',
      borderLeft: 'none'
    };
    volDownBtnStyleClass = `absolute left-[-6px] top-32 w-1.5 h-6 transition-all shadow-md z-10`;
    volDownBtnStyle = {
      backgroundColor: buttonColor,
      borderRadius: buttonStyle === 'Pill' ? '9999px 0 0 9999px' : '3px 0 0 3px',
      borderLeft: 'none'
    };
  }

  return (
    <div className="relative mx-auto w-56 sm:w-64">
      {/* View Selector Tabs */}
      <div className="flex justify-center gap-1.5 mb-4 bg-surface-raised/60 p-1 rounded-xl w-full border border-border/30">
        {[
          { id: 'front', label: 'Front', icon: '📱' },
          { id: 'back', label: 'Back', icon: '🎨' },
          { id: 'box', label: 'Box', icon: '📦' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setViewMode(tab.id as any)}
            className={`flex-1 py-1 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
              viewMode === tab.id
                ? 'bg-accent/25 text-accent-soft shadow-sm border border-accent/30'
                : 'text-muted hover:text-fg'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Side Buttons */}
      {viewMode !== 'box' && (
        <>
          <div
            className={powerBtnStyleClass}
            style={powerBtnStyle}
          />
          <div
            className={volUpBtnStyleClass}
            style={volUpBtnStyle}
          />
          <div
            className={volDownBtnStyleClass}
            style={volDownBtnStyle}
          />
        </>
      )}

      {/* Smartwatch Straps background */}
      {viewMode !== 'box' && category === 'smartwatch' && renderWatchStraps(strapType, strapColor)}

      {/* Laptop Keyboard deck background */}
      {viewMode !== 'box' && category === 'laptop' && renderLaptopDeck(backlightColor)}

      {/* Phone Frame */}
      <div className={`relative ${frameRounded} ${frameAspectClass} border-[3px] border-border-bright/40 bg-gradient-to-b from-[#1a1f2e] via-[#0f1219] to-[#0a0d12] p-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-all duration-300`}>
        {/* Screen Bezel / Device Back / Retail Box */}
        <div className={`relative overflow-hidden bg-gradient-to-b from-surface to-[#06080c] transition-all duration-300 ${bezelRounded}`}>
          {viewMode === 'front' && (
            <div className={`transition-all duration-300 ${bezelPaddingClass}`}>
              {/* Notch */}
              {renderNotch(notchStyle)}

              {/* Curved screen reflection edges */}
              {screenCurvature === 'Curved' && (
                <>
                  <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-20" />
                  <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-white/10 to-transparent pointer-events-none z-20" />
                </>
              )}

              {/* Screen Content */}
              <div className={`relative ${screenMinHeightClass} transition-all duration-300 ${screenRoundingClass}`}>
                {/* Status Bar */}
                <div className="mb-3 flex items-center justify-between px-1 text-[9px] text-muted/70">
                  <span className="font-mono">9:41</span>
                  <span className="font-semibold">Device Tycoon</span>
                  <span>100%</span>
                </div>

                {/* Device Name */}
                <div className="mb-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted/50">Device</p>
                  <p className="truncate text-lg font-bold text-fg drop-shadow-lg">{deviceName}</p>
                  <div className="mx-auto mt-1 h-0.5 w-8 rounded-full bg-gradient-to-r from-accent to-glow" />
                </div>

                {/* Score Badge */}
                <div className="mx-auto mb-4 flex w-16 items-center justify-center">
                  <div className="relative">
                    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-surface-hover"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeDasharray={`${overallScore}, 100`}
                        className="text-accent transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-fg">{overallScore}</span>
                      <span className="text-[7px] text-muted/60">SCORE</span>
                    </div>
                  </div>
                </div>

                {/* Component Slots */}
                <div className="space-y-1.5">
                  {slots.map((slot) => {
                    const comp = placedComponents[slot] ? getComponent(placedComponents[slot]!) : null;
                    const meta = SLOT_META[slot];
                    const isOver = dragOverSlot === slot;
                    return (
                      <div
                        key={slot}
                        onDragOver={(e) => handleDragOver(e, slot)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, slot)}
                        className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all duration-200 ${
                          comp
                            ? 'border-accent/30 bg-accent/8 shadow-[0_0_12px_rgba(59,130,246,0.06)]'
                            : isOver
                              ? 'border-accent border-dashed bg-accent/15 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                              : 'border-border/40 border-dashed hover:border-border-bright/60 hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${meta.gradient} text-sm shadow-md`}>
                          {meta.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-medium uppercase tracking-wider text-muted/60">{meta.label}</p>
                          {comp ? (
                            <p className="truncate text-xs font-medium text-fg">{comp.name}</p>
                          ) : (
                            <p className="text-[10px] text-muted/40">Drop component</p>
                          )}
                        </div>
                        {comp && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearSlot(slot);
                            }}
                            className="hidden h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-[9px] text-danger hover:bg-danger/30 group-hover:flex"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Home Indicator */}
                <div className="mt-4 flex justify-center">
                  <div className="h-1 w-20 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          )}

          {viewMode === 'back' && (
            <div
              className={`relative flex flex-col justify-between p-6 ${screenMinHeightClass} ${bezelRounded} overflow-hidden`}
              style={getFinishStyles(bodyColor, frameStyle)}
            >
              {/* Camera module */}
              {renderCameraModule(cameraLayout, cameraShape)}

              {/* Brand Logo in the center */}
              <div className="flex-1 flex items-center justify-center pt-10">
                <div
                  className="text-5xl opacity-85 select-none transform transition-transform duration-300 hover:scale-110"
                  style={{
                    filter: getLogoGlowStyle(logoGlow, bodyColor)
                  }}
                >
                  {LOGO_MAP[logoIcon] || '🟢'}
                </div>
              </div>

              {/* Device Brand text/info at the bottom */}
              <div className="text-center pb-2">
                <p className="text-[9px] tracking-[0.2em] opacity-40 uppercase font-bold text-white/80">{category}</p>
                <p className="text-[8px] tracking-wider opacity-30 mt-0.5 text-white/60">Designed in Tycoon Lab</p>
              </div>
            </div>
          )}

          {viewMode === 'box' && (
            <div
              className={`relative flex flex-col justify-between ${screenMinHeightClass} ${bezelRounded} overflow-hidden border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-transform duration-300 hover:scale-[1.01]`}
              style={{
                backgroundColor: boxColor,
              }}
            >
              {/* Side shading / depth lines for 3D packaging effect */}
              <div className="absolute top-0 left-0 w-2.5 h-full bg-white/5" />
              <div className="absolute top-0 right-0 w-2.5 h-full bg-black/10" />
              <div className="absolute top-0 left-0 w-full h-2.5 bg-white/10" />
              <div className="absolute bottom-0 left-0 w-full h-2.5 bg-black/20" />

              <div className="flex-1">
                {renderBoxStyle(boxStyle, deviceName, logoIcon, boxTextColor)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Glow Effect */}
      <div className="pointer-events-none absolute -inset-4 rounded-[3rem] bg-gradient-to-b from-accent/5 via-transparent to-glow/5 blur-2xl" />
    </div>
  );
}

function AccordionCategory({
  slot,
  isOpen,
  onToggle,
  components,
  selectedId,
  onSelect,
  onDragStart,
}: {
  slot: ComponentSlot;
  isOpen: boolean;
  onToggle: () => void;
  components: ComponentDef[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onDragStart: (e: React.DragEvent, comp: ComponentDef) => void;
}) {
  const meta = SLOT_META[slot];
  const hasSelection = !!selectedId;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-surface-raised/40">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all ${
          isOpen
            ? 'bg-surface-hover/60 border-b border-border/40'
            : 'hover:bg-surface-hover/40'
        }`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient} text-lg shadow-lg`}>
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{meta.label}</p>
          <p className="text-[10px] text-muted/60">{components.length} options</p>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[10px] text-accent-soft">✓</span>
          )}
          <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="space-y-2 p-3">
          {components.map((comp) => (
            <ComponentTierCard
              key={comp.id}
              component={comp}
              isSelected={selectedId === comp.id}
              onDragStart={onDragStart}
              onClick={() => onSelect(comp.id)}
            />
          ))}
          {components.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/50 py-6 text-center">
              <span className="mb-1 text-xl opacity-30">🔒</span>
              <p className="text-[11px] text-muted/60">Research to unlock</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Designer() {
  const draft = useGameStore((s) => s.draft);
  const unlockedTech = useGameStore((s) => s.unlockedTech);
  const craftedParts = useGameStore((s) => s.craftedParts);
  const setDraftCategory = useGameStore((s) => s.setDraftCategory);
  const setDraftName = useGameStore((s) => s.setDraftName);
  const setDraftComponent = useGameStore((s) => s.setDraftComponent);
  const setDraftSellPrice = useGameStore((s) => s.setDraftSellPrice);
  const resetDraft = useGameStore((s) => s.resetDraft);
  const saveDesign = useGameStore((s) => s.saveDesign);
  const releaseDevice = useGameStore((s) => s.releaseDevice);

  const [sidebarTab, setSidebarTab] = useState<'components' | 'aesthetics'>('components');
  const [openCategory, setOpenCategory] = useState<ComponentSlot>('screen');
  const [openAestheticSection, setOpenAestheticSection] = useState<'body' | 'camera' | 'hardware' | 'box'>('body');
  const [isReleasing, setIsReleasing] = useState(false);

  const {
    bodyColor = '#475569',
    frameStyle = 'Matte Glass',
    logoIcon = 'Circle',
    cameraLayout = 'Single Lens',
    boxColor = '#0f172a',
    boxTextColor = '#f8fafc',
    boxStyle = 'Minimalist',
    notchStyle = 'Punch Hole',
    screenCurvature = 'Flat',
    buttonColor = '#475569',
    buttonStyle = 'Classic',
    bezelSize = 'Thin',
    strapType = 'Sport',
    strapColor = '#1c1c1e',
    backlightColor = '#06b6d4',
    smartwatchShape = 'Square',
    logoGlow = 'None',
    cameraShape = 'Integrated',
    buttonPlacement = 'Right Side',
  } = draft;

  const updateAesthetics = useCallback((updates: Partial<DraftDesign>) => {
    useGameStore.setState((s) => ({
      draft: {
        ...s.draft,
        ...updates
      }
    }));
  }, []);

  const { stats, unitCost } = calcDesignStats(draft.category, draft.components);
  const margin = draft.sellPrice - unitCost;

  const componentsBySlot = useMemo(() => {
    const map: Record<ComponentSlot, ComponentDef[]> = {} as Record<ComponentSlot, ComponentDef[]>;
    for (const slot of SLOTS_BY_CATEGORY[draft.category]) {
      map[slot] = getAvailableComponents(slot, draft.category, unlockedTech, craftedParts);
    }
    return map;
  }, [draft.category, unlockedTech, craftedParts]);

  const totalSlots = SLOTS_BY_CATEGORY[draft.category].length;
  const filledSlots = SLOTS_BY_CATEGORY[draft.category].filter((s) => draft.components[s]).length;

  const handleDragStart = useCallback((e: React.DragEvent, comp: ComponentDef) => {
    e.dataTransfer.setData('component-id', comp.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback(
    (slot: ComponentSlot, componentId: string) => {
      const comp = getComponent(componentId);
      if (comp && comp.slot === slot) {
        setDraftComponent(slot, componentId);
        setOpenCategory(slot);
      }
    },
    [setDraftComponent],
  );

  const handleClearSlot = useCallback(
    (slot: ComponentSlot) => {
      const first = getAvailableComponents(slot, draft.category, unlockedTech, craftedParts)[0];
      if (first) setDraftComponent(slot, first.id);
    },
    [draft.category, unlockedTech, craftedParts, setDraftComponent],
  );

  const handleRelease = useCallback(() => {
    if (filledSlots < totalSlots) return;
    setIsReleasing(true);
    setTimeout(() => {
      releaseDevice();
      setIsReleasing(false);
    }, 800);
  }, [filledSlots, totalSlots, releaseDevice]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 gap-4">
      {/* ── Left Sidebar: Components / Aesthetics ── */}
      <aside className="flex w-[300px] shrink-0 flex-col gap-3">
        {/* Sidebar Tabs */}
        <div className="flex gap-1 bg-surface-raised/60 p-1 rounded-xl border border-border/30 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarTab('components')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              sidebarTab === 'components'
                ? 'bg-accent/20 text-accent-soft shadow-sm border border-accent/20'
                : 'text-muted hover:text-fg'
            }`}
          >
            ⚙️ Components
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab('aesthetics')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              sidebarTab === 'aesthetics'
                ? 'bg-accent/20 text-accent-soft shadow-sm border border-accent/20'
                : 'text-muted hover:text-fg'
            }`}
          >
            🎨 Aesthetics
          </button>
        </div>

        {sidebarTab === 'components' ? (
          <>
            {/* Category Tabs */}
            <div className="flex gap-1 rounded-xl bg-surface-raised/60 p-1 shrink-0">
              {(Object.keys(CATEGORY_META) as DeviceCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDraftCategory(cat)}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    draft.category === cat
                      ? 'bg-accent/20 text-accent-soft shadow-sm'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  {CATEGORY_META[cat].icon}
                </button>
              ))}
            </div>

            {/* Accordion List */}
            <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
              {SLOTS_BY_CATEGORY[draft.category].map((slot) => (
                <AccordionCategory
                  key={slot}
                  slot={slot}
                  isOpen={openCategory === slot}
                  onToggle={() => setOpenCategory(openCategory === slot ? '' as ComponentSlot : slot)}
                  components={componentsBySlot[slot]}
                  selectedId={draft.components[slot]}
                  onSelect={(id) => setDraftComponent(slot, id)}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </>
        ) : (
          /* Accordion Aesthetics List */
          <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
            {/* Chassis & Finish Section */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-surface-raised/40">
              <button
                type="button"
                onClick={() => setOpenAestheticSection(openAestheticSection === 'body' ? '' as any : 'body')}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all ${
                  openAestheticSection === 'body'
                    ? 'bg-surface-hover/60 border-b border-border/40'
                    : 'hover:bg-surface-hover/40'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-sm shadow-lg">🎨</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">Chassis & Finish</p>
                  <p className="text-[10px] text-muted/60">Color, finish material</p>
                </div>
                <span className={`text-xs transition-transform duration-200 ${openAestheticSection === 'body' ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openAestheticSection === 'body' && (
                <div className="space-y-4 p-3 bg-surface-raised/20">
                  {/* Finish Material */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Finish Material</label>
                    <div className="grid grid-cols-2 gap-1">
                      {FINISH_OPTIONS.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => updateAesthetics({ frameStyle: f })}
                          className={`py-1.5 px-1.5 text-[9px] font-semibold rounded-lg border transition-all text-left ${
                            frameStyle === f
                              ? 'bg-accent/20 border-accent/50 text-accent-soft shadow-sm'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Body Color Swatches */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Color Presets</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => updateAesthetics({ bodyColor: c.hex })}
                          className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                            bodyColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-accent scale-105 shadow-md shadow-accent/20'
                              : 'border-white/10 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {bodyColor.toLowerCase() === c.hex.toLowerCase() && (
                            <span className="text-white text-[10px] font-bold drop-shadow-md">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Hex Color */}
                  <div className="flex items-center justify-between border-t border-border/10 pt-3">
                    <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Custom Hex</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={bodyColor}
                        onChange={(e) => updateAesthetics({ bodyColor: e.target.value })}
                        className="w-16 bg-surface-raised border border-border/40 px-1.5 py-0.5 rounded text-[11px] font-mono outline-none focus:border-accent text-fg"
                      />
                      <input
                        type="color"
                        value={bodyColor.startsWith('#') && bodyColor.length === 7 ? bodyColor : '#475569'}
                        onChange={(e) => updateAesthetics({ bodyColor: e.target.value })}
                        className="w-6 h-6 rounded border border-border/40 cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera & Logo Section */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-surface-raised/40">
              <button
                type="button"
                onClick={() => setOpenAestheticSection(openAestheticSection === 'camera' ? '' as any : 'camera')}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all ${
                  openAestheticSection === 'camera'
                    ? 'bg-surface-hover/60 border-b border-border/40'
                    : 'hover:bg-surface-hover/40'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-sm shadow-lg">📷</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">Camera & Logo</p>
                  <p className="text-[10px] text-muted/60">Module, brand symbol</p>
                </div>
                <span className={`text-xs transition-transform duration-200 ${openAestheticSection === 'camera' ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openAestheticSection === 'camera' && (
                <div className="space-y-4 p-3 bg-surface-raised/20">
                  {/* Camera Layout */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Camera Module</label>
                    <div className="grid grid-cols-2 gap-1">
                      {CAMERA_LAYOUTS.map((layout) => (
                        <button
                          key={layout}
                          type="button"
                          onClick={() => updateAesthetics({ cameraLayout: layout })}
                          className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-left ${
                            cameraLayout === layout
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {layout}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Symbol */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Brand Logo</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LOGO_OPTIONS.map((logo) => (
                        <button
                          key={logo}
                          type="button"
                          onClick={() => updateAesthetics({ logoIcon: logo })}
                          className={`py-2 px-0.5 text-center rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            logoIcon === logo
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          <span className="text-xl">{LOGO_MAP[logo]}</span>
                          <span className="text-[8px] uppercase tracking-wider">{logo}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Camera Bump Shape */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Camera Bump Shape</label>
                    <div className="grid grid-cols-2 gap-1">
                      {CAMERA_SHAPES.map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => updateAesthetics({ cameraShape: shape })}
                          className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-left ${
                            cameraShape === shape
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Logo Glow */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Logo Glow Effect</label>
                    <div className="grid grid-cols-2 gap-1">
                      {LOGO_GLOW_OPTIONS.map((glow) => (
                        <button
                          key={glow}
                          type="button"
                          onClick={() => updateAesthetics({ logoGlow: glow })}
                          className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-left ${
                            logoGlow === glow
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {glow}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Display & Hardware Section */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-surface-raised/40">
              <button
                type="button"
                onClick={() => setOpenAestheticSection(openAestheticSection === 'hardware' ? '' as any : 'hardware')}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all ${
                  openAestheticSection === 'hardware'
                    ? 'bg-surface-hover/60 border-b border-border/40'
                    : 'hover:bg-surface-hover/40'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-sm shadow-lg">⚙️</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">Display & Hardware</p>
                  <p className="text-[10px] text-muted/60">Bezel, notch, buttons spec</p>
                </div>
                <span className={`text-xs transition-transform duration-200 ${openAestheticSection === 'hardware' ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openAestheticSection === 'hardware' && (
                <div className="space-y-4 p-3 bg-surface-raised/20">
                  {/* Notch Style (Only smartphones / tablets) */}
                  {(draft.category === 'smartphone' || draft.category === 'tablet') && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Notch Style</label>
                      <div className="grid grid-cols-2 gap-1">
                        {NOTCH_STYLES.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => updateAesthetics({ notchStyle: n })}
                            className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-left ${
                              notchStyle === n
                                ? 'bg-accent/20 border-accent/50 text-accent-soft'
                                : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Screen Curvature */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Screen Glass Curvature</label>
                    <div className="grid grid-cols-2 gap-1">
                      {CURVATURE_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateAesthetics({ screenCurvature: c })}
                          className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-left ${
                            screenCurvature === c
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bezel Thickness */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Bezel Thickness</label>
                    <div className="grid grid-cols-2 gap-1">
                      {BEZEL_SIZES.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateAesthetics({ bezelSize: b })}
                          className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-left ${
                            bezelSize === b
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Physical Buttons Style */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Side Button Style</label>
                    <div className="grid grid-cols-3 gap-1">
                      {BUTTON_STYLES.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateAesthetics({ buttonStyle: b })}
                          className={`py-1.5 px-0.5 text-[9px] font-bold rounded-lg border transition-all ${
                            buttonStyle === b
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Color Preset */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Button Color Presets</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => updateAesthetics({ buttonColor: c.hex })}
                          className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                            buttonColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-accent scale-105 shadow-md shadow-accent/20'
                              : 'border-white/10 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {buttonColor.toLowerCase() === c.hex.toLowerCase() && (
                            <span className="text-white text-[10px] font-bold drop-shadow-md">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-border/10 pt-2 mt-2">
                      <span className="text-[9px] text-muted uppercase tracking-wider font-bold">Custom Button Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={buttonColor}
                          onChange={(e) => updateAesthetics({ buttonColor: e.target.value })}
                          className="w-16 bg-surface-raised border border-border/40 px-1.5 py-0.5 rounded text-[11px] font-mono outline-none focus:border-accent text-fg"
                        />
                        <input
                          type="color"
                          value={buttonColor.startsWith('#') && buttonColor.length === 7 ? buttonColor : '#475569'}
                          onChange={(e) => updateAesthetics({ buttonColor: e.target.value })}
                          className="w-6 h-6 rounded border border-border/40 cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Button Placement */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Button Placement</label>
                    <div className="grid grid-cols-2 gap-1">
                      {BUTTON_PLACEMENTS.map((placement) => (
                        <button
                          key={placement}
                          type="button"
                          onClick={() => updateAesthetics({ buttonPlacement: placement })}
                          className={`py-1.5 px-0.5 text-[9px] font-bold rounded-lg border transition-all ${
                            buttonPlacement === placement
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {placement}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Smartwatch Face Shape */}
                  {draft.category === 'smartwatch' && (
                    <div className="space-y-1 border-t border-border/10 pt-3">
                      <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Watch Face Shape</label>
                      <div className="grid grid-cols-2 gap-1">
                        {SMARTWATCH_SHAPES.map((shape) => (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => updateAesthetics({ smartwatchShape: shape })}
                            className={`py-1.5 px-0.5 text-[9px] font-bold rounded-lg border transition-all ${
                              smartwatchShape === shape
                                ? 'bg-accent/20 border-accent/50 text-accent-soft'
                                : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                            }`}
                          >
                            {shape}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Smartwatch Straps Type (Only smartwatch) */}
                  {draft.category === 'smartwatch' && (
                    <>
                      <div className="space-y-1 border-t border-border/10 pt-3">
                        <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Watch Strap Type</label>
                        <div className="grid grid-cols-3 gap-1">
                          {STRAP_TYPES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateAesthetics({ strapType: s })}
                              className={`py-1.5 px-0.5 text-[9px] font-bold rounded-lg border transition-all ${
                                strapType === s
                                  ? 'bg-accent/20 border-accent/50 text-accent-soft'
                                  : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Strap Color Presets</label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {STRAP_COLOR_PRESETS.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => updateAesthetics({ strapColor: c.hex })}
                              className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                                strapColor.toLowerCase() === c.hex.toLowerCase()
                                  ? 'border-accent scale-105 shadow-md shadow-accent/20'
                                  : 'border-white/10 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            >
                              {strapColor.toLowerCase() === c.hex.toLowerCase() && (
                                <span className="text-white text-[10px] font-bold drop-shadow-md">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-border/10 pt-2 mt-2">
                          <span className="text-[9px] text-muted uppercase tracking-wider font-bold">Custom Strap Color</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={strapColor}
                              onChange={(e) => updateAesthetics({ strapColor: e.target.value })}
                              className="w-16 bg-surface-raised border border-border/40 px-1.5 py-0.5 rounded text-[11px] font-mono outline-none focus:border-accent text-fg"
                            />
                            <input
                              type="color"
                              value={strapColor.startsWith('#') && strapColor.length === 7 ? strapColor : '#1c1c1e'}
                              onChange={(e) => updateAesthetics({ strapColor: e.target.value })}
                              className="w-6 h-6 rounded border border-border/40 cursor-pointer bg-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Laptop Keyboard Backlight (Only laptop) */}
                  {draft.category === 'laptop' && (
                    <div className="space-y-1 border-t border-border/10 pt-3">
                      <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Keyboard Backlight Color</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {BACKLIGHT_PRESETS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => updateAesthetics({ backlightColor: c.hex })}
                            className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                              backlightColor.toLowerCase() === c.hex.toLowerCase()
                                ? 'border-accent scale-105 shadow-md shadow-accent/20'
                                : 'border-white/10 hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {backlightColor.toLowerCase() === c.hex.toLowerCase() && (
                              <span className="text-white text-[10px] font-bold drop-shadow-md">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-border/10 pt-2 mt-2">
                        <span className="text-[9px] text-muted uppercase tracking-wider font-bold">Custom Backlight</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={backlightColor}
                            onChange={(e) => updateAesthetics({ backlightColor: e.target.value })}
                            className="w-16 bg-surface-raised border border-border/40 px-1.5 py-0.5 rounded text-[11px] font-mono outline-none focus:border-accent text-fg"
                          />
                          <input
                            type="color"
                            value={backlightColor.startsWith('#') && backlightColor.length === 7 ? backlightColor : '#06b6d4'}
                            onChange={(e) => updateAesthetics({ backlightColor: e.target.value })}
                            className="w-6 h-6 rounded border border-border/40 cursor-pointer bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Packaging Box Section */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-surface-raised/40">
              <button
                type="button"
                onClick={() => setOpenAestheticSection(openAestheticSection === 'box' ? '' as any : 'box')}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all ${
                  openAestheticSection === 'box'
                    ? 'bg-surface-hover/60 border-b border-border/40'
                    : 'hover:bg-surface-hover/40'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-sm shadow-lg">📦</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">Retail Box</p>
                  <p className="text-[10px] text-muted/60">Packaging box options</p>
                </div>
                <span className={`text-xs transition-transform duration-200 ${openAestheticSection === 'box' ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openAestheticSection === 'box' && (
                <div className="space-y-4 p-3 bg-surface-raised/20">
                  {/* Box Style */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Box Layout</label>
                    <div className="grid grid-cols-3 gap-1">
                      {BOX_STYLES.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => updateAesthetics({ boxStyle: style })}
                          className={`py-1.5 px-0.5 text-[9px] font-bold rounded-lg border transition-all ${
                            boxStyle === style
                              ? 'bg-accent/20 border-accent/50 text-accent-soft'
                              : 'border-border/40 hover:border-border-bright/60 hover:bg-white/[0.02] text-muted'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Box Color */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Box Color</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {BOX_COLOR_PRESETS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => updateAesthetics({ boxColor: c.hex })}
                          className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                            boxColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-accent scale-105 shadow-md shadow-accent/20'
                              : 'border-white/10 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {boxColor.toLowerCase() === c.hex.toLowerCase() && (
                            <span className="text-white text-[10px] font-bold drop-shadow-md">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-border/10 pt-2.5 mt-2">
                      <span className="text-[9px] text-muted uppercase tracking-wider font-bold">Custom Box Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={boxColor}
                          onChange={(e) => updateAesthetics({ boxColor: e.target.value })}
                          className="w-16 bg-surface-raised border border-border/40 px-1.5 py-0.5 rounded text-[11px] font-mono outline-none focus:border-accent text-fg"
                        />
                        <input
                          type="color"
                          value={boxColor.startsWith('#') && boxColor.length === 7 ? boxColor : '#0f172a'}
                          onChange={(e) => updateAesthetics({ boxColor: e.target.value })}
                          className="w-6 h-6 rounded border border-border/40 cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Font / Foil Color</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {BOX_TEXT_PRESETS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => updateAesthetics({ boxTextColor: c.hex })}
                          className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                            boxTextColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-accent scale-105 shadow-md shadow-accent/20'
                              : 'border-white/10 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {boxTextColor.toLowerCase() === c.hex.toLowerCase() && (
                            <span className="text-white text-[10px] font-bold drop-shadow-md">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-border/10 pt-2.5 mt-2">
                      <span className="text-[9px] text-muted uppercase tracking-wider font-bold">Custom Text Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={boxTextColor}
                          onChange={(e) => updateAesthetics({ boxTextColor: e.target.value })}
                          className="w-16 bg-surface-raised border border-border/40 px-1.5 py-0.5 rounded text-[11px] font-mono outline-none focus:border-accent text-fg"
                        />
                        <input
                          type="color"
                          value={boxTextColor.startsWith('#') && boxTextColor.length === 7 ? boxTextColor : '#f8fafc'}
                          onChange={(e) => updateAesthetics({ boxTextColor: e.target.value })}
                          className="w-6 h-6 rounded border border-border/40 cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── Center: Device Preview ── */}
      <main className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold">Device Designer</h2>
          <Button
            variant="secondary"
            onClick={() => {
              resetDraft();
              setOpenCategory('screen');
            }}
          >
            + New Device
          </Button>
        </div>
        <Card className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
            {/* Editable Name */}
            <div className="text-center">
              <input
                value={draft.name}
                onChange={(e) => setDraftName(e.target.value)}
                className="bg-transparent text-center text-3xl font-bold tracking-tight text-fg outline-none placeholder:text-muted/30 focus:text-accent-soft"
                placeholder="Device Name"
              />
              <p className="mt-1 text-xs text-muted">{CATEGORY_META[draft.category].label} · {filledSlots}/{totalSlots} slots filled</p>
              {filledSlots < totalSlots && (
                <p className="mt-1 text-[10px] text-warning">
                  Missing: {SLOTS_BY_CATEGORY[draft.category]
                    .filter((s) => !draft.components[s])
                    .map((s) => SLOT_META[s].label)
                    .join(', ')}
                </p>
              )}
            </div>

            {/* Phone Mockup */}
            <PhoneMockup
              category={draft.category}
              placedComponents={draft.components}
              onDrop={handleDrop}
              onClearSlot={handleClearSlot}
              deviceName={draft.name}
              stats={stats}
              bodyColor={bodyColor}
              frameStyle={frameStyle}
              logoIcon={logoIcon}
              cameraLayout={cameraLayout}
              boxColor={boxColor}
              boxTextColor={boxTextColor}
              boxStyle={boxStyle}
              notchStyle={notchStyle}
              screenCurvature={screenCurvature}
              buttonColor={buttonColor}
              buttonStyle={buttonStyle}
              bezelSize={bezelSize}
              strapType={strapType}
              strapColor={strapColor}
              backlightColor={backlightColor}
              smartwatchShape={smartwatchShape}
              logoGlow={logoGlow}
              cameraShape={cameraShape}
              buttonPlacement={buttonPlacement}
            />
          </div>
        </Card>
      </main>

      {/* ── Right Sidebar: Stats ── */}
      <aside className="custom-scrollbar flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto">
        {/* Performance Scores */}
        <Card glow>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Performance Scores</h3>
          <div className="space-y-3">
            {[
              { label: 'Performance', value: stats.performance, max: 100, icon: '⚡', color: 'bg-accent', display: `${stats.performance}/100` },
              { label: 'Battery Life', value: stats.battery, max: 100, icon: '🔋', color: 'bg-success', display: `${batteryToHours(stats.battery)} hours` },
              { label: 'Camera', value: stats.camera, max: 100, icon: '📷', color: 'bg-pink-400', display: `${cameraToMP(stats.camera)} MP` },
              { label: 'Design Appeal', value: stats.build, max: 100, icon: '🎨', color: 'bg-glow', display: `${stats.build}/100` },
              { label: 'Market Appeal', value: stats.appeal, max: 100, icon: '❤️', color: 'bg-cyan-400', display: `${stats.appeal}/100` },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <span>{stat.icon}</span> {stat.label}
                  </span>
                  <span className="font-mono text-sm font-bold text-fg">{stat.display}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stat.color}`}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Financial Breakdown */}
        <Card>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Financial Breakdown</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-surface-raised/80 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted/60">Cost to Produce</p>
                <p className="font-mono text-lg font-bold text-warning">${unitCost.toFixed(2)}</p>
              </div>
              <span className="text-xl opacity-40">🏭</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-raised/80 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted/60">Suggested Price</p>
                <p className="font-mono text-lg font-bold text-accent-soft">${draft.sellPrice.toFixed(2)}</p>
              </div>
              <span className="text-xl opacity-40">🏷️</span>
            </div>
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${
              margin >= 0 ? 'bg-success/10' : 'bg-danger/10'
            }`}>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted/60">Expected Profit</p>
                <p className={`font-mono text-lg font-bold ${margin >= 0 ? 'text-success' : 'text-danger'}`}>
                  ${margin.toFixed(2)}
                </p>
              </div>
              <span className="text-xl opacity-40">💰</span>
            </div>
          </div>
        </Card>

        {/* Overall Rating */}
        <Card className="flex-1">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Overall Rating</h3>
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-surface-hover"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${stats.appeal}, 100`}
                  className="text-accent transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-fg">{stats.appeal}</span>
                <span className="text-[9px] text-muted/60">/100</span>
              </div>
            </div>
            <p className="text-center text-sm font-semibold text-fg">
              {stats.appeal >= 80 ? '🔥 Flagship Killer' : stats.appeal >= 60 ? '⭐ Strong Contender' : stats.appeal >= 40 ? '👍 Solid Device' : '📦 Budget Option'}
            </p>
            <p className="mt-1 text-center text-[11px] text-muted/60">
              {stats.appeal >= 80
                ? 'Ready to dominate the market'
                : stats.appeal >= 60
                  ? 'Competitive with top sellers'
                  : stats.appeal >= 40
                    ? 'Good value proposition'
                    : 'Entry-level pricing expected'}
            </p>
          </div>
        </Card>
      </aside>
    </div>

    {/* ── Action Bar (full-width footer) ── */}
    <Card className="mt-3 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Cost</p>
            <p className="font-mono text-xl font-bold text-warning">${unitCost.toFixed(0)}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Price</p>
            <p className="font-mono text-xl font-bold text-accent-soft">${draft.sellPrice.toFixed(0)}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Profit</p>
            <p className={`font-mono text-xl font-bold ${margin >= 0 ? 'text-success' : 'text-danger'}`}>
              ${margin.toFixed(0)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            Set Price
            <input
              type="number"
              min={unitCost}
              step={5}
              value={draft.sellPrice}
              onChange={(e) => setDraftSellPrice(Number(e.target.value))}
              className="w-20 rounded-lg border border-border bg-surface-raised px-2 py-1.5 font-mono text-sm text-fg outline-none focus:border-accent"
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => saveDesign()}
            className="min-w-[120px] text-sm"
          >
            💾 Save Draft
          </Button>
          <Button
            variant="glow"
            onClick={handleRelease}
            disabled={filledSlots < totalSlots || isReleasing}
            className="min-w-[160px] text-sm"
          >
            {isReleasing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Releasing...
              </span>
            ) : (
              <>🚀 Release</>
            )}
          </Button>
        </div>
      </div>
    </Card>
    </div>
  );
}
