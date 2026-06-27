import React, { useEffect } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'

const { width: W, height: H } = Dimensions.get('window')

function Orb({
  x, y, size, color, delay,
  periodX = 7000, periodY = 9000, ampX = 16, ampY = 24, scaleAmp = 0.05,
}: {
  x: number; y: number; size: number; color: string; delay: number
  periodX?: number; periodY?: number; ampX?: number; ampY?: number; scaleAmp?: number
}) {
  const fade  = useSharedValue(0)
  const phase = useSharedValue(0)

  useEffect(() => {
    fade.value = withDelay(delay, withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }))
    phase.value = withRepeat(
      withTiming(Math.PI * 2, { duration: periodX + periodY, easing: Easing.linear }),
      -1,
      false,
    )
  }, [])

  const style = useAnimatedStyle(() => {
    const t = phase.value
    return {
      opacity: fade.value,
      transform: [
        { translateX: Math.sin(t * (periodY / (periodX + periodY)) * 2) * ampX },
        { translateY: Math.cos(t * (periodX / (periodX + periodY)) * 1.6) * ampY },
        { scale: 1 + Math.sin(t * 1.3) * scaleAmp },
      ],
    }
  })

  return (
    <Animated.View
      style={[
        styles.orb,
        { left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  )
}

export default function Bg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#07091C', '#0B0E28', '#07091C']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Orb x={W * 0.55} y={H * 0.04} size={280} color="rgba(79,128,255,0.12)" delay={0}   periodX={7000} periodY={9200} ampX={18} ampY={26} />
      <Orb x={-60}      y={H * 0.45} size={220} color="rgba(0,204,171,0.10)"  delay={500} periodX={8400} periodY={6600} ampX={14} ampY={20} />
      <Orb x={W * 0.6}  y={H * 0.68} size={180} color="rgba(79,128,255,0.08)" delay={800} periodX={6200} periodY={9800} ampX={12} ampY={22} />
    </View>
  )
}

const styles = StyleSheet.create({
  orb: { position: 'absolute' },
})
