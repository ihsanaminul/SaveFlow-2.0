import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { C } from '@/constants/colors'

const PLATFORMS = [
  { color: '#FF0000', icon: 'youtube'            as const },
  { color: '#69C9D0', icon: 'music-note-outline'  as const },
  { color: '#E1306C', icon: 'instagram'           as const },
  { color: '#1DA1F2', icon: 'twitter'             as const },
  { color: '#1877F2', icon: 'facebook'            as const },
  { color: '#E60023', icon: 'pinterest'           as const },
  { color: '#FF4500', icon: 'reddit'              as const },
  { color: '#1AB7EA', icon: 'vimeo'               as const },
]

function AnimIn({ children, delay, style }: {
  children: React.ReactNode; delay: number; style?: any
}) {
  const op = useSharedValue(0)
  const ty = useSharedValue(24)
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }))
    ty.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 200 }))
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }))
  return <Animated.View style={[anim, style]}>{children}</Animated.View>
}

export default function WelcomeScreen() {
  const router = useRouter()

  async function handleStart() {
    await AsyncStorage.setItem('welcomed', '1')
    router.replace('/(tabs)' as any)
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={s.root}>
        {/* Logo row */}
        <AnimIn delay={0}>
          <View style={s.logoRow}>
            <View style={s.logoBox}>
              <MaterialCommunityIcons name="download-circle-outline" size={34} color={C.accent} />
            </View>
            <View>
              <Text style={s.appName}>SaveFlow</Text>
              <Text style={s.appTag}>VIDEO DOWNLOADER</Text>
            </View>
          </View>
        </AnimIn>

        {/* Hero */}
        <AnimIn delay={100}>
          <View style={s.heroWrap}>
            <Text style={s.heroLine1}>DOWNLOAD</Text>
            <Text style={s.heroLine2}>TANPA BATAS.</Text>
            <Text style={s.heroSub}>
              Unduh video & foto dari 8+ platform tanpa{'\n'}watermark — cepat, gratis, tanpa login.
            </Text>
          </View>
        </AnimIn>

        {/* Platforms */}
        <AnimIn delay={200}>
          <View style={s.platforms}>
            {PLATFORMS.map((p, i) => (
              <View
                key={i}
                style={[s.platDot, { backgroundColor: p.color + '22', borderColor: p.color + '55' }]}
              >
                <MaterialCommunityIcons name={p.icon} size={18} color={p.color} />
              </View>
            ))}
          </View>
        </AnimIn>

        {/* Stat pills */}
        <AnimIn delay={300}>
          <View style={s.pillRow}>
            <View style={s.statPill}>
              <Text style={s.statNum}>8+</Text>
              <Text style={s.statLbl}>Platform</Text>
            </View>
            <View style={[s.statPill, { backgroundColor: C.accentDim, borderColor: C.borderHi }]}>
              <Text style={[s.statNum, { color: C.accent }]}>0</Text>
              <Text style={[s.statLbl, { color: C.accent }]}>Watermark</Text>
            </View>
            <View style={s.statPill}>
              <Text style={s.statNum}>∞</Text>
              <Text style={s.statLbl}>Gratis</Text>
            </View>
          </View>
        </AnimIn>

        {/* CTA */}
        <AnimIn delay={420}>
          <TouchableOpacity style={s.cta} onPress={handleStart} activeOpacity={0.82}>
            <MaterialCommunityIcons name="arrow-right-circle" size={22} color={C.bg} />
            <Text style={s.ctaTxt}>MULAI SEKARANG</Text>
          </TouchableOpacity>
        </AnimIn>

        {/* Footer */}
        <AnimIn delay={520}>
          <View style={s.footerWrap}>
            <Text style={s.footer}>Tanpa akun · Tanpa iklan · 100% Gratis</Text>
            <Text style={s.copy}>© 2025 SaveFlow  by Cleo 桜闇</Text>
          </View>
        </AnimIn>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  root: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: 'center',
    gap: 26,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: C.accentDim,
    borderWidth: 1.5,
    borderColor: C.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    color: C.text,
  },
  appTag: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 3,
    marginTop: 2,
  },
  heroWrap: { gap: 2 },
  heroLine1: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 46,
    color: C.text,
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  heroLine2: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 46,
    color: C.accent,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  heroSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: C.textSub,
    lineHeight: 22,
    marginTop: 10,
  },
  platforms: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platDot: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRow: { flexDirection: 'row', gap: 10 },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    gap: 3,
  },
  statNum: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    color: C.text,
  },
  statLbl: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textSub,
  },
  cta: {
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaTxt: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 15,
    color: C.bg,
    letterSpacing: 1.5,
  },
  footerWrap: { alignItems: 'center', gap: 4 },
  footer: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
  },
  copy: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
})
