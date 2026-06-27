import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring,
} from 'react-native-reanimated'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import C from '@/constants/colors'

const PLATFORMS = [
  { color: '#FF0000', icon: 'youtube' as const },
  { color: '#69C9D0', icon: 'music-note-outline' as const },
  { color: '#E1306C', icon: 'instagram' as const },
  { color: '#1DA1F2', icon: 'twitter' as const },
  { color: '#1877F2', icon: 'facebook' as const },
  { color: '#FF4500', icon: 'reddit' as const },
  { color: '#E60023', icon: 'pinterest' as const },
  { color: '#1AB7EA', icon: 'vimeo' as const },
]

export default function WelcomeScreen() {
  const router = useRouter()

  const op1 = useSharedValue(0)
  const y1  = useSharedValue(30)
  const op2 = useSharedValue(0)
  const y2  = useSharedValue(40)
  const op3 = useSharedValue(0)
  const sc3 = useSharedValue(0.88)

  useEffect(() => {
    op1.value = withDelay(80,  withTiming(1, { duration: 650 }))
    y1.value  = withDelay(80,  withTiming(0, { duration: 650 }))
    op2.value = withDelay(300, withTiming(1, { duration: 600 }))
    y2.value  = withDelay(300, withTiming(0, { duration: 600 }))
    op3.value = withDelay(550, withTiming(1, { duration: 500 }))
    sc3.value = withDelay(550, withSpring(1, { damping: 14 }))
  }, [])

  const anim1 = useAnimatedStyle(() => ({
    opacity: op1.value,
    transform: [{ translateY: y1.value }],
  }))
  const anim2 = useAnimatedStyle(() => ({
    opacity: op2.value,
    transform: [{ translateY: y2.value }],
  }))
  const anim3 = useAnimatedStyle(() => ({
    opacity: op3.value,
    transform: [{ scale: sc3.value }],
  }))

  async function handleStart() {
    await AsyncStorage.setItem('welcomed', '1')
    router.replace('/(tabs)' as any)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.container}>
        <Animated.View style={[styles.logoArea, anim1]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="download-circle-outline" size={50} color={C.accent} />
          </View>
          <Text style={styles.appName}>SaveFlow</Text>
          <Text style={styles.appTag}>VIDEO DOWNLOADER</Text>
        </Animated.View>

        <Animated.View style={[styles.heroArea, anim2]}>
          <Text style={styles.heroLine1}>DOWNLOAD</Text>
          <Text style={styles.heroLine2}>TANPA BATAS.</Text>
          <Text style={styles.heroSub}>
            Unduh video & foto dari 8+ platform{'\n'}tanpa watermark. Cepat, gratis, mudah.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.platformRow, anim2]}>
          {PLATFORMS.map((p, i) => (
            <View
              key={i}
              style={[styles.platformDot, { backgroundColor: p.color + '22', borderColor: p.color + '55' }]}
            >
              <MaterialCommunityIcons name={p.icon} size={16} color={p.color} />
            </View>
          ))}
        </Animated.View>

        <Animated.View style={anim3}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleStart} activeOpacity={0.82}>
            <Text style={styles.ctaBtnText}>MULAI SEKARANG</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={C.bg} />
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>Tanpa login · Tanpa iklan · 100% gratis</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 26,
  },
  logoArea: {
    alignItems: 'flex-start',
    gap: 6,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: C.accentDim,
    borderWidth: 1.5,
    borderColor: C.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 26,
    color: C.text,
    letterSpacing: 0.5,
  },
  appTag: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textSub,
    letterSpacing: 3,
  },
  heroArea: {
    gap: 6,
  },
  heroLine1: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 46,
    color: C.text,
    letterSpacing: -1,
    lineHeight: 50,
  },
  heroLine2: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 46,
    color: C.accent,
    letterSpacing: -1,
    lineHeight: 52,
  },
  heroSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: C.textSub,
    lineHeight: 23,
    marginTop: 6,
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 15,
    color: C.bg,
    letterSpacing: 1.5,
  },
  footer: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
})
