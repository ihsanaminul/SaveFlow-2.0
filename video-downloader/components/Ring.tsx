import React, { useEffect, useRef, memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Svg, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

interface RingProps {
  progress: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  color1?: string
  color2?: string
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export const Ring = memo(function Ring({
  progress,
  size = 200,
  strokeWidth = 14,
  label,
  sublabel,
  color1 = '#7BA5FF',
  color2 = '#00CCAB',
}: RingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const progressSV = useSharedValue(0)
  const pulseSV     = useSharedValue(0)
  const popSV       = useSharedValue(1)
  const didPopRef   = useRef(false)

  useEffect(() => {
    progressSV.value = withTiming(progress, { duration: 650, easing: Easing.out(Easing.cubic) })

    if (progress >= 100 && !didPopRef.current) {
      didPopRef.current = true
      popSV.value = withSequence(
        withSpring(1.14, { damping: 6, stiffness: 220 }),
        withSpring(1, { damping: 8, stiffness: 220 }),
      )
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success)
    }
    if (progress < 100) didPopRef.current = false
  }, [progress])

  useEffect(() => {
    pulseSV.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])

  const animatedProps = useAnimatedProps(() => {
    const offset = circumference - (progressSV.value / 100) * circumference
    return { strokeDashoffset: offset }
  })

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.30 + pulseSV.value * 0.40,
  }))

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popSV.value }],
  }))

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, popStyle]}>
      <Animated.View style={[
        StyleSheet.absoluteFill,
        { borderRadius: size / 2, backgroundColor: 'rgba(79,128,255,0.18)', transform: [{ scale: 0.86 }] },
        glowStyle,
      ]} />

      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={color1} />
            <Stop offset="100%" stopColor={color2} />
          </SvgGrad>
        </Defs>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={styles.pct}>{Math.round(progress)}%</Text>
        {label    && <Text style={styles.label}>{label}</Text>}
        {sublabel && <Text style={styles.sub}>{sublabel}</Text>}
      </View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 3 },
  pct:    { fontSize: 36, fontWeight: '800', color: '#FFFFFF', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -1 },
  label:  { fontSize: 12, color: 'rgba(255,255,255,0.60)', fontFamily: 'PlusJakartaSans_500Medium' },
  sub:    { fontSize: 10, color: 'rgba(255,255,255,0.40)', fontFamily: 'PlusJakartaSans_400Regular' },
})