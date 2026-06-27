export const C = {
  bg:    '#07091C',
  bg2:   '#0B0E28',
  bg3:   '#0F1333',

  card:     'rgba(255,255,255,0.045)',
  cardMid:  'rgba(255,255,255,0.075)',
  cardDeep: 'rgba(11,14,40,0.92)',
  border:   'rgba(255,255,255,0.09)',
  borderHi: 'rgba(79,128,255,0.45)',
  borderSub:'rgba(255,255,255,0.06)',

  blue:       '#4F80FF',
  blueMid:    '#3D6EF5',
  blueLight:  '#7BA5FF',
  blueDim:    'rgba(79,128,255,0.16)',
  blueGlow:   'rgba(79,128,255,0.42)',

  teal:       '#00CCAB',
  tealLight:  '#33DFBF',
  tealDim:    'rgba(0,204,171,0.16)',
  tealGlow:   'rgba(0,204,171,0.38)',

  white:   '#FFFFFF',
  white80: 'rgba(255,255,255,0.80)',
  white60: 'rgba(255,255,255,0.60)',
  white40: 'rgba(255,255,255,0.40)',
  white20: 'rgba(255,255,255,0.20)',
  white10: 'rgba(255,255,255,0.10)',
  white06: 'rgba(255,255,255,0.055)',

  success:    '#22D3A4',
  successDim: 'rgba(34,211,164,0.16)',
  successBg:  'rgba(34,211,164,0.10)',
  error:      '#F43F5E',
  errorDim:   'rgba(244,63,94,0.16)',
  warning:    '#FBBF24',
  warningDim: 'rgba(251,191,36,0.16)',

  youtube:   '#FF0000',
  tiktok:    '#69C9D0',
  instagram: '#E1306C',
  facebook:  '#1877F2',
  twitter:   '#1DA1F2',
  pinterest: '#E60023',
  reddit:    '#FF4500',
  vimeo:     '#1AB7EA',
  twitch:    '#9146FF',

  accent:    '#4F80FF',
  accent2:   '#00CCAB',
} as const

export const G = {
  bg:       ['#07091C', '#0B0E28', '#0F1333'] as const,
  blue:     ['#7BA5FF', '#4F80FF', '#2D5CE8'] as const,
  teal:     ['#33DFBF', '#00CCAB', '#009E86'] as const,
  mixed:    ['#4F80FF', '#00CCAB'] as const,
  mixedRev: ['#00CCAB', '#4F80FF'] as const,
  card:     ['rgba(15,20,55,0.94)', 'rgba(9,12,32,0.97)'] as const,
  success:  ['#22D3A4', '#00A882'] as const,
  error:    ['#F43F5E', '#C21237'] as const,
  dark:     ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const,
} as const

export const Colors = C
export default C
