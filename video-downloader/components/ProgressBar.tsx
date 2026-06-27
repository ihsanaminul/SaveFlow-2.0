import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { C } from '@/constants/colors'

interface ProgressBarProps {
  progress: number
  height?: number
  shimmer?: boolean
}

export function ProgressBar({ progress, height = 5, shimmer = true }: ProgressBarProps) {
  const widthSV   = useSharedValue(0)
  const shimmerSV = useSharedValue(0)

  useEffect(() => {
    widthSV.value = withTiming(progress, { duration: 500, easing: Easing.out(Easing.cubic) })
  }, [progress])

  useEffect(() => {
    if (!shimmer) return
    shimmerSV.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [shimmer])

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, widthSV.value))}%`,
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.30 + shimmerSV.value * 0.45,
  }))

  return (
    <View style={[s.track, { height, borderRadius: height }]}>
      <Animated.View style={[s.fill, { borderRadius: height }, fillStyle]}>
        <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        {shimmer && (
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }, glowStyle]} />
        )}
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  track: { backgroundColor: C.white10, overflow: 'hidden' },
  fill:  { height: '100%', minWidth: 4, overflow: 'hidden' },
})