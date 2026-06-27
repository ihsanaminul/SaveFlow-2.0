import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { C } from '@/constants/colors'

const PLATFORM_DATA: Record<string, { color: string; icon: string; bg: string }> = {
  YouTube:    { color: '#FF0000', icon: 'youtube',       bg: 'rgba(255,0,0,0.16)'      },
  TikTok:     { color: '#69C9D0', icon: 'music',         bg: 'rgba(105,201,208,0.16)'  },
  Instagram:  { color: '#E1306C', icon: 'instagram',     bg: 'rgba(225,48,108,0.16)'   },
  Facebook:   { color: '#1877F2', icon: 'facebook',      bg: 'rgba(24,119,242,0.16)'   },
  Twitter:    { color: '#1DA1F2', icon: 'twitter',       bg: 'rgba(29,161,242,0.16)'   },
  'Twitter/X':{ color: '#1DA1F2', icon: 'twitter',       bg: 'rgba(29,161,242,0.16)'   },
  Pinterest:  { color: '#E60023', icon: 'bookmark',      bg: 'rgba(230,0,35,0.16)'     },
  Reddit:     { color: '#FF4500', icon: 'message-circle',bg: 'rgba(255,69,0,0.16)'     },
  Vimeo:      { color: '#1AB7EA', icon: 'video',         bg: 'rgba(26,183,234,0.16)'   },
  Dailymotion:{ color: '#0066DC', icon: 'play-circle',   bg: 'rgba(0,102,220,0.16)'    },
  Twitch:     { color: '#9146FF', icon: 'tv',            bg: 'rgba(145,70,255,0.16)'   },
}

export function getPlatformColor(name: string): string {
  return PLATFORM_DATA[name]?.color ?? C.blue
}

export function getPlatformIcon(name: string): string {
  return PLATFORM_DATA[name]?.icon ?? 'globe'
}

export function getPlatformBg(name: string): string {
  return PLATFORM_DATA[name]?.bg ?? C.blueDim
}

interface PlatformChipProps {
  name: string
  size?: number
  showLabel?: boolean
  style?: ViewStyle
}

export function PlatformChip({ name, size = 36, showLabel, style }: PlatformChipProps) {
  const data  = PLATFORM_DATA[name] ?? { color: C.blue, icon: 'globe', bg: C.blueDim }
  const icon  = Math.round(size * 0.44)

  return (
    <View style={[styles.wrap, style]}>
      <View style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: data.bg },
      ]}>
        <Feather name={data.icon as any} size={icon} color={data.color} />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: data.color }]} numberOfLines={1}>
          {name}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap:   { alignItems: 'center', gap: 5 },
  circle: { alignItems: 'center', justifyContent: 'center' },
  label:  { fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' },
})

export default PlatformChip
