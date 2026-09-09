import { Platform } from 'react-native';

/**
 * Utopia design tokens, ported from the dashboard's `@theme` block in
 * utopia-dashboard/app/globals.css.
 *
 * Values are copied verbatim rather than re-derived, so the two clients cannot
 * drift. Several of them are deliberate and would be wrong to "improve":
 * inkMuted is #5b6b80 rather than a stock slate-500 because slate-500 measures
 * 4.34:1 on the sunken surface and fails WCAG AA; okShell exists because okInk
 * is 3.26:1 on the dark shell and unusable there.
 */

export const color = {
  /* Canvas and structure */
  canvas: '#f8fafc',
  surface: '#ffffff',
  sunken: '#f1f5f9',
  line: '#e2e8f0',
  lineStrong: '#cbd5e1',

  /* Primary and text */
  ink: '#0f172a',
  inkMuted: '#5b6b80',

  /* Operational shell: primary ground, secondary type */
  shell: '#0f172a',
  shellLine: '#1e293b',
  shellInk: '#ffffff',
  shellMuted: '#94a3b8',
  shellHover: '#1e293b',

  /* Semantic status. Cool-leaning and desaturated so they read as state, not
   * as a second brand colour. */
  dangerBg: '#fef2f2',
  dangerInk: '#b91c1c',
  infoBg: '#eff6ff',
  infoInk: '#1d4ed8',
  okBg: '#ecfdf5',
  okInk: '#047857',
  okShell: '#6ee7b7',
  warnBg: '#fffbeb',
  warnInk: '#b45309',
} as const;

/**
 * Shape scale. The dashboard documents "cards 12px, controls 6px, badges pill,
 * no other radii". At VISUAL_DENSITY 9 the mobile data surfaces run
 * edge-to-edge and separate on hairlines instead of floating as cards, so the
 * card radius drops to 0 here. The rest of the scale is unchanged.
 *
 *   surfaces  0   (full-bleed data grids)
 *   controls  6   (buttons, inputs)
 *   badge     pill
 *
 * That is the whole scale. Nothing in this app uses another radius.
 */
export const radius = {
  surface: 0,
  control: 6,
  badge: 999,
} as const;

/**
 * No custom typeface is bundled, so this resolves to the platform system
 * stack. Claiming Geist Mono without loading it would be a lie in the code.
 */
export const font = Platform.select({
  ios: { sans: 'System', mono: 'Menlo' },
  android: { sans: 'sans-serif', mono: 'monospace' },
  default: { sans: 'System', mono: 'monospace' },
})!;

/**
 * Type roles, not a size ramp. Numeric data is mono with tight tracking;
 * labels are uppercase with wide tracking; prose is sans.
 */
export const type = {
  /** Primary KPI figure. */
  metric: { fontFamily: font.mono, fontSize: 40, letterSpacing: -1.5, color: color.ink },
  /** Secondary figure inside a metric, e.g. the denominator. */
  metricSub: { fontFamily: font.mono, fontSize: 22, letterSpacing: -0.5, color: color.inkMuted },
  /** Table values, codes, coordinates, counts. */
  data: { fontFamily: font.mono, fontSize: 13, letterSpacing: -0.2, color: color.ink },
  dataMuted: { fontFamily: font.mono, fontSize: 12, letterSpacing: -0.2, color: color.inkMuted },
  /** Section captions and field labels. */
  label: { fontFamily: font.sans, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' as const, textTransform: 'uppercase' as const, color: color.inkMuted },
  /** Badge text. */
  badge: { fontFamily: font.sans, fontSize: 9, letterSpacing: 1, fontWeight: '800' as const, textTransform: 'uppercase' as const },
  /** Row titles. */
  title: { fontFamily: font.sans, fontSize: 15, fontWeight: '600' as const, color: color.ink },
  /** Prose. Used sparingly; this is not a reading surface. */
  body: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: color.inkMuted },
} as const;

/** 4px base. Density 9 keeps the ladder short. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

/** Every border in the app is one hairline of this colour. */
export const hairline = { borderColor: color.line, borderWidth: 1 } as const;
