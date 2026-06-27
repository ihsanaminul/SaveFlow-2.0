import React, { useEffect, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, Dimensions, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Feather } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { C } from '@/constants/colors'
import { PlatformChip } from '@/components/PlatformChip'

const { width: W, height: H } = Dimensions.get('window')

const FLOATING_PLATFORMS = [
  { name: 'YouTube',   x: W * 0.10, y: H * 0.16, delay: 400, periodX: 2600, periodY: 3100, amp: 14 },
  { name: 'TikTok',    x: W * 0.74, y: H * 0.14, delay: 600, periodX: 3200, periodY: 2800, amp: 16 },
  { name: 'Instagram', x: W * 0.05, y: H * 0.42, delay: 700, periodX: 2900, periodY: 3400, amp: 12 },
  { name: 'Facebook',  x: W * 0.78, y: H * 0.40, delay: 500, periodX: 3600, periodY: 2600, amp: 18 },
  { name: 'Twitter',   x: W * 0.15, y: H * 0.62, delay: 800, periodX: 2700, periodY: 3200, amp: 15 },
  { name: 'Pinterest', x: W * 0.72, y: H * 0.60, delay: 550, periodX: 3100, periodY: 2900, amp: 13 },
]

function FloatingPlatform({ name, x, y, delay, periodX, periodY, amp }: {
  name: string; x: number; y: number; delay: number; periodX: number; periodY: number; amp: number
}) {
  const fade  = useSharedValue(0)
  const float = useSharedValue(0)
  const sc    = useSharedValue(1)

  useEffect(() => {
    fade.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }))
    float.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1,  { duration: periodX, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: periodY, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    ))
    sc.value = withDelay(delay + 200, withRepeat(
      withSequence(
        withTiming(1.06, { duration: (periodX + periodY) / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(1,    { duration: (periodX + periodY) / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    ))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity:   fade.value,
    transform: [
      { translateY: float.value * amp },
      { scale:      sc.value },
    ],
  }))

  return (
    <Animated.View style={[{ position: 'absolute', left: x - 26, top: y - 26 }, style]}>
      <View style={fp.wrap}>
        <PlatformChip name={name} size={48} />
      </View>
    </Animated.View>
  )
}

const fp = StyleSheet.create({
  wrap: {
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    shadowOpacity: 0.50,
    elevation: 14,
  },
})

export default function WelcomeScreen() {
  const router = useRouter()

  const fadeIn   = useSharedValue(0)
  const slideUp  = useSharedValue(44)
  const btnScale = useSharedValue(1)
  const pulse    = useSharedValue(0)
  const glowSc   = useSharedValue(1)

  useEffect(() => {
    fadeIn.value  = withDelay(350, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }))
    slideUp.value = withDelay(450, withSpring(0, { damping: 18, stiffness: 200 }))

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )

    glowSc.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1,    { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])

  const bottomStyle = useAnimatedStyle(() => ({
    opacity:   fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }))

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity:   0.30 + pulse.value * 0.45,
    transform: [{ scale: glowSc.value }],
  }))

  const handleStart = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    btnScale.value = withSequence(
      withSpring(0.92, { damping: 12, stiffness: 350 }),
      withSpring(1,    { damping: 10, stiffness: 280 }),
    )
    await AsyncStorage.setItem('welcomed', '1')
    router.replace('/(tabs)' as any)
  }, [router])

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#07091C', '#0D1333', '#07091C']} style={StyleSheet.absoluteFill} />

      {/* Background orbs */}
      <View style={[s.orb, { width: 340, height: 340, top: H * 0.03, left: W * 0.48 - 170, backgroundColor: 'rgba(79,128,255,0.14)' }]} />
      <View style={[s.orb, { width: 240, height: 240, top: H * 0.52, left: -70,            backgroundColor: 'rgba(0,204,171,0.10)'  }]} />
      <View style={[s.orb, { width: 180, height: 180, top: H * 0.60, left: W * 0.65,       backgroundColor: 'rgba(79,128,255,0.09)' }]} />

      {/* Floating platform icons */}
      {FLOATING_PLATFORMS.map(p => (
        <FloatingPlatform key={p.name} {...p} />
      ))}

      {/* Center logo */}
      <View style={s.logoSection}>
        <Animated.View style={[s.logoGlow, glowStyle]} />
        <View style={s.logoShadow}>
          <View style={s.logoBox}>
            <LinearGradient
              colors={['#4F80FF', '#00CCAB']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.logoGrad}
            >
              <Feather name="download-cloud" size={48} color="#fff" />
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <Animated.View style={[s.bottom, bottomStyle]}>
        <View style={s.brandRow}>
          <Text style={s.brandName}>SaveFlow</Text>
        </View>
        <Text style={s.tagline}>Download videos & photos from{'\n'}any platform — fast and free.</Text>

        <View style={s.featureRow}>
          {[
            { icon: 'zap',       label: 'Fast'      },
            { icon: 'shield',    label: 'Private'   },
            { icon: 'download',  label: 'HD Quality' },
          ].map((f, i) => (
            <View key={i} style={s.featureItem}>
              <View style={s.featureIcon}>
                <Feather name={f.icon as any} size={14} color={C.teal} />
              </View>
              <Text style={s.featureLbl}>{f.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleStart}
          onPressIn={() => { btnScale.value = withSpring(0.95, { damping: 12, stiffness: 300 }) }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 10, stiffness: 260 }) }}
          style={{ width: '100%' }}
        >
          <Animated.View style={[s.btn, btnStyle]}>
            <LinearGradient
              colors={['#4F80FF', '#00CCAB']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btnInner}
            >
              <Text style={s.btnTxt}>Get Started</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </LinearGradient>
          </Animated.View>
        </Pressable>

        <Text style={s.legal}>By continuing you agree to our Terms of Service.</Text>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#07091C', alignItems: 'center', justifyContent: 'center' },
  orb:         { position: 'absolute', borderRadius: 9999 },

  logoSection: { alignItems: 'center', justifyContent: 'center', marginBottom: 60 },
  logoGlow:    { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(79,128,255,0.45)' },
  logoShadow:  { shadowColor: C.blue, shadowOffset: { width: 0, height: 10 }, shadowRadius: 40, shadowOpacity: 0.70, elevation: 28 },
  logoBox:     { borderRadius: 32, overflow: 'hidden' },
  logoGrad:    { width: 110, height: 110, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },

  bottom:      { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 28, paddingBottom: 52, gap: 12 },

  brandRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName:   { fontSize: 36, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -1 },

  tagline:     { fontSize: 15, color: C.white60, textAlign: 'center', lineHeight: 24, fontFamily: 'PlusJakartaSans_400Regular' },

  featureRow:  { flexDirection: 'row', gap: 16, marginVertical: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.tealDim, alignItems: 'center', justifyContent: 'center' },
  featureLbl:  { fontSize: 12, color: C.white60, fontFamily: 'PlusJakartaSans_600SemiBold' },

  btn:         { width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: C.blue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 22, elevation: 18 },
  btnInner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 32 },
  btnTxt:      { fontSize: 17, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },

  legal:       { fontSize: 11, color: C.white20, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' },
})
