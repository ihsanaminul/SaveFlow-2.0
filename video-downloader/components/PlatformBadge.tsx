import React, { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Svg, Defs, LinearGradient as SvgGradient, Stop, Rect, Circle, Path } from 'react-native-svg'

const PLATFORM_CONFIG: Record<string, { bg: string; bg2?: string; label: string; emoji?: string }> = {
  YouTube:   { bg: '#FF0000', bg2: '#CC0000', label: 'YT',  emoji: '▶' },
  TikTok:    { bg: '#010101', bg2: '#222222', label: 'TT',  emoji: '♪' },
  Instagram: { bg: '#C13584', bg2: '#833AB4', label: 'IG',  emoji: '◉' },
  Facebook:  { bg: '#1877F2', bg2: '#0D5FCC', label: 'FB',  emoji: 'f' },
  Twitter:   { bg: '#14171A', bg2: '#2A2A2A', label: 'X',   emoji: 'X' },
  Pinterest: { bg: '#E60023', bg2: '#B5001A', label: 'PT',  emoji: '⊕' },
  Reddit:    { bg: '#FF4500', bg2: '#CC3700', label: 'RD',  emoji: '●' },
  Vimeo:     { bg: '#1AB7EA', bg2: '#0E90C0', label: 'VM',  emoji: '▷' },
  Twitch:    { bg: '#9146FF', bg2: '#7B2FBE', label: 'TV',  emoji: '◈' },
  Lainnya:   { bg: '#7C3AED', bg2: '#5B21B6', label: '+',   emoji: '⊞' },
}

export function getPlatformConfig(name: string) {
  const key = Object.keys(PLATFORM_CONFIG).find(k => k.toLowerCase() === name?.toLowerCase())
  return key ? PLATFORM_CONFIG[key] : { bg: '#7C3AED', bg2: '#5B21B6', label: name?.slice(0, 2)?.toUpperCase() || '?', emoji: '?' }
}

export function getPlatformColor(name: string): string {
  return getPlatformConfig(name).bg
}

export const PlatformBadge = memo(function PlatformBadge({
  name, size = 32, showLabel = false,
}: { name: string; size?: number; showLabel?: boolean }) {
  const cfg = getPlatformConfig(name)
  const fontSize = size * 0.38
  const borderRadius = size * 0.28

  return (
    <View style={{ alignItems: 'center', gap: 5 }}>
      <View style={[
        styles.badge,
        { width: size, height: size, borderRadius, backgroundColor: cfg.bg },
      ]}>
        <View style={[StyleSheet.absoluteFill, { borderRadius, backgroundColor: cfg.bg2 || cfg.bg, opacity: 0.4 }]} />
        <Text style={[styles.label, { fontSize }]}>{cfg.emoji || cfg.label}</Text>
      </View>
      {showLabel && (
        <Text style={styles.name}>{name}</Text>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 4,
    elevation: 6,
    overflow: 'hidden',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  name: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.60)',
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
  },
})

export default PlatformBadge
