export const C = {
  bg:    '#0D0D0D',
  bg2:   '#111111',
  bg3:   '#161616',

  card:   '#141414',
  card2:  '#1A1A1A',
  card3:  '#222222',

  border:   '#2A2A2A',
  border2:  '#333333',
  borderHi: 'rgba(200,245,0,0.45)',

  accent:     '#C8F500',
  accentSoft: '#D4FF1A',
  accentDark: '#9EBF00',
  accentDim:  'rgba(200,245,0,0.13)',
  accentGlow: 'rgba(200,245,0,0.28)',

  text:      '#FFFFFF',
  textSub:   '#888888',
  textMuted: '#444444',

  white:   '#FFFFFF',
  white80: 'rgba(255,255,255,0.80)',
  white60: 'rgba(255,255,255,0.60)',
  white40: 'rgba(255,255,255,0.40)',
  white20: 'rgba(255,255,255,0.20)',
  white10: 'rgba(255,255,255,0.10)',
  white06: 'rgba(255,255,255,0.06)',

  success:    '#00D68F',
  successDim: 'rgba(0,214,143,0.15)',
  error:      '#FF4D4D',
  errorDim:   'rgba(255,77,77,0.15)',
  warning:    '#FFB800',
  warningDim: 'rgba(255,184,0,0.15)',

  youtube:   '#FF0000',
  tiktok:    '#69C9D0',
  instagram: '#E1306C',
  facebook:  '#1877F2',
  twitter:   '#1DA1F2',
  pinterest: '#E60023',
  reddit:    '#FF4500',
  vimeo:     '#1AB7EA',
} as const

export const G = {
  bg:      ['#0D0D0D', '#111111'] as const,
  accent:  ['#D4FF1A', '#C8F500'] as const,
  dark:    ['#1A1A1A', '#111111'] as const,
  card:    ['#1A1A1A', '#141414'] as const,
  success: ['#00D68F', '#009E65'] as const,
  error:   ['#FF4D4D', '#CC2222'] as const,
} as const

export const Colors = C
export default C
