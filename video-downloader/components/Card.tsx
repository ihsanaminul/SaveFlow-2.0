import React, { useState } from 'react'
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { C } from '@/constants/colors'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  radius?: number
  glow?: boolean
  glowColor?: string
  gradient?: boolean
  gradColors?: readonly [string, string]
  noPad?: boolean
  pressable?: boolean
  onPress?: () => void
}

export default function Card({
  children, style, radius = 18, glow, glowColor, gradient, gradColors, noPad,
  pressable, onPress,
}: CardProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const s: ViewStyle = {
    borderRadius: radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glow ? (glowColor ?? C.borderHi) : C.border,
    ...(glow && {
      shadowColor: glowColor ?? C.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 18,
      shadowOpacity: 0.35,
      elevation: 10,
    }),
  }

  const content = gradient && gradColors ? (
    <View style={[s, style]}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill]}
      />
      {children}
    </View>
  ) : (
    <View style={[s, { backgroundColor: C.card }, !noPad && styles.pad, style]}>
      {children}
    </View>
  )

  if (!pressable) return content

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 13, stiffness: 260 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 11, stiffness: 220 }) }}
    >
      <Animated.View style={animStyle}>
        {content}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pad: {},
})