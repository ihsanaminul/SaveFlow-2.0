import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient as SvgGrad, Stop, ClipPath } from 'react-native-svg'

export type Platform =
  | 'YouTube' | 'TikTok' | 'Instagram' | 'Facebook'
  | 'Twitter' | 'X' | 'Reddit' | 'Vimeo' | 'Pinterest'
  | string

const PLATFORM_META: Record<string, { color: string; glow: string }> = {
  youtube:   { color: '#FF0000', glow: 'rgba(255,0,0,0.35)' },
  tiktok:    { color: '#ffffff', glow: 'rgba(255,255,255,0.25)' },
  instagram: { color: '#E1306C', glow: 'rgba(225,48,108,0.35)' },
  facebook:  { color: '#1877F2', glow: 'rgba(24,119,242,0.35)' },
  twitter:   { color: '#ffffff', glow: 'rgba(255,255,255,0.25)' },
  x:         { color: '#ffffff', glow: 'rgba(255,255,255,0.25)' },
  reddit:    { color: '#FF4500', glow: 'rgba(255,69,0,0.35)' },
  vimeo:     { color: '#1AB7EA', glow: 'rgba(26,183,234,0.35)' },
  pinterest: { color: '#E60023', glow: 'rgba(230,0,35,0.35)' },
}

function normalize(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('youtube'))   return 'youtube'
  if (n.includes('tiktok'))    return 'tiktok'
  if (n.includes('instagram')) return 'instagram'
  if (n.includes('facebook'))  return 'facebook'
  if (n.includes('twitter') || n === 'x' || n.includes('/x')) return 'twitter'
  if (n.includes('reddit'))    return 'reddit'
  if (n.includes('vimeo'))     return 'vimeo'
  if (n.includes('pinterest')) return 'pinterest'
  return n
}

export function getPlatformColor(name: string): string {
  return PLATFORM_META[normalize(name)]?.color ?? '#9A6CFF'
}

export function getPlatformGlow(name: string): string {
  return PLATFORM_META[normalize(name)]?.glow ?? 'rgba(123,77,255,0.35)'
}

// ─── Individual SVG icons (24×24 viewBox) ────────────────────

function YouTubeIcon({ color = '#FF0000', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"
        fill={color}
      />
      <Path d="M9.75 15.02l5.75-3.02-5.75-3.02v6.04z" fill="#fff" />
    </Svg>
  )
}

function TikTokIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgGrad id="tiktokGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#69C9D0" />
          <Stop offset="100%" stopColor="#EE1D52" />
        </SvgGrad>
      </Defs>
      <Path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.72a4.85 4.85 0 0 1-1.01-.03z"
        fill="url(#tiktokGrad)"
      />
    </Svg>
  )
}

function InstagramIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgGrad id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%"   stopColor="#FFDC80" />
          <Stop offset="25%"  stopColor="#FCAF45" />
          <Stop offset="50%"  stopColor="#F77737" />
          <Stop offset="75%"  stopColor="#C13584" />
          <Stop offset="100%" stopColor="#833AB4" />
        </SvgGrad>
      </Defs>
      <Rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igGrad)" />
      <Circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" fill="none" />
      <Circle cx="17.5" cy="6.5" r="1.1" fill="#fff" />
    </Svg>
  )
}

function FacebookIcon({ color = '#1877F2', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
        fill={color}
      />
    </Svg>
  )
}

function XIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.25 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
        fill="#fff"
      />
    </Svg>
  )
}

function RedditIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#FF4500" />
      <Path
        d="M20 12a2 2 0 0 0-2-2 1.99 1.99 0 0 0-1.32.5 9.9 9.9 0 0 0-5.4-1.56l.92-4.32 3 .63a1.4 1.4 0 1 0 .17-.82l-3.36-.7a.27.27 0 0 0-.32.2L10.6 9.1a9.93 9.93 0 0 0-5.29 1.56A2 2 0 1 0 2.89 14a3.67 3.67 0 0 0 0 .49c0 2.5 2.9 4.52 6.5 4.52s6.5-2.02 6.5-4.52a3.67 3.67 0 0 0 0-.49A2 2 0 0 0 20 12zm-13 1.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm5.62 2.65a3.18 3.18 0 0 1-2.12.64 3.18 3.18 0 0 1-2.12-.64.25.25 0 0 1 .34-.36 2.73 2.73 0 0 0 1.78.52 2.73 2.73 0 0 0 1.78-.52.25.25 0 0 1 .34.36zm-.12-1.65a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"
        fill="#fff"
      />
    </Svg>
  )
}

function VimeoIcon({ color = '#1AB7EA', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881l-1.94-7.125c-.717-2.585-1.482-3.878-2.308-3.878-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.787 4.782.964 5.487.537 2.443 1.124 3.661 1.766 3.661.498 0 1.247-.787 2.247-2.358 1-1.569 1.536-2.765 1.607-3.582.144-1.557-.45-2.337-1.778-2.337-.633 0-1.286.146-1.958.432 1.3-4.257 3.782-6.322 7.448-6.197 2.716.086 3.997 1.839 3.819 5.162z"
        fill={color}
      />
    </Svg>
  )
}

function PinterestIcon({ color = '#E60023', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
        fill={color}
      />
    </Svg>
  )
}

// ─── Exported icon component ──────────────────────────────────

interface PlatformIconProps {
  name: string
  size?: number
  showGlow?: boolean
}

export function PlatformIcon({ name, size = 26, showGlow = true }: PlatformIconProps) {
  const key = normalize(name)
  const meta = PLATFORM_META[key]
  const glowColor = meta?.glow ?? 'rgba(123,77,255,0.25)'

  const icon = (() => {
    switch (key) {
      case 'youtube':   return <YouTubeIcon size={size} />
      case 'tiktok':    return <TikTokIcon size={size} />
      case 'instagram': return <InstagramIcon size={size} />
      case 'facebook':  return <FacebookIcon size={size} />
      case 'twitter':
      case 'x':         return <XIcon size={size} />
      case 'reddit':    return <RedditIcon size={size} />
      case 'vimeo':     return <VimeoIcon size={size} />
      case 'pinterest': return <PinterestIcon size={size} />
      default:          return <YouTubeIcon size={size} />
    }
  })()

  return (
    <View style={[st.wrap, { width: size + 8, height: size + 8 }]}>
      {showGlow && (
        <View style={[st.glow, {
          width: size + 16,
          height: size + 16,
          borderRadius: (size + 16) / 2,
          backgroundColor: glowColor,
          top: -8,
          left: -8,
        }]} />
      )}
      {icon}
    </View>
  )
}

const st = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', opacity: 0.55 },
})
