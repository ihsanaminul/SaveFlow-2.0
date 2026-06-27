import React, { useCallback, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay,
  withRepeat, withSequence,
  FadeInDown, ZoomIn, Easing,
} from 'react-native-reanimated'
import Bg from '@/components/Bg'
import Card from '@/components/Card'
import { PlatformChip, getPlatformColor } from '@/components/PlatformChip'
import { useStore } from '@/store/useStore'
import { C } from '@/constants/colors'
import { formatFileSize } from '@/utils/fileUtils'

const { width: W } = Dimensions.get('window')

const PLATFORMS = [
  'YouTube', 'TikTok', 'Instagram', 'Facebook',
  'Twitter', 'Pinterest', 'Reddit', 'Vimeo',
]

// ── Fade + slide section ──────────────────────────────────────
function FadeSection({ children, delay = 0, style }: {
  children: React.ReactNode; delay?: number; style?: any
}) {
  const op = useSharedValue(0)
  const ty = useSharedValue(24)
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 440, easing: Easing.out(Easing.cubic) }))
    ty.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 200 }))
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }))
  return <Animated.View style={[anim, style]}>{children}</Animated.View>
}

// ── Animated number ───────────────────────────────────────────
function AnimNum({ value, style }: { value: number; style?: any }) {
  const n = useSharedValue(0)
  useEffect(() => {
    n.value = withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) })
  }, [value])
  const [display, setDisplay] = React.useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setDisplay(Math.round(n.value))
      if (Math.round(n.value) >= value) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [value])
  return <Text style={style}>{display}</Text>
}

// ── Pulse glow ────────────────────────────────────────────────
function PulseGlow({ color, size = 120 }: { color: string; size?: number }) {
  const op = useSharedValue(0.25)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    )
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value }))
  return (
    <Animated.View style={[{
      position: 'absolute', width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
    }, anim]} />
  )
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, icon, color, delay }: {
  label: string; value: string | number; icon: string; color: string; delay: number
}) {
  const sc = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  return (
    <FadeSection delay={delay} style={{ flex: 1 }}>
      <Pressable
        onPressIn={() => { sc.value = withSpring(0.93, { damping: 12, stiffness: 260 }) }}
        onPressOut={() => { sc.value = withSpring(1, { damping: 10, stiffness: 220 }) }}
      >
        <Animated.View style={anim}>
          <Card radius={16} style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: color + '1E' }]}>
              <Feather name={icon as any} size={14} color={color} />
            </View>
            <Text style={s.statVal}>{value}</Text>
            <Text style={s.statLbl}>{label}</Text>
          </Card>
        </Animated.View>
      </Pressable>
    </FadeSection>
  )
}

// ── Recent item ───────────────────────────────────────────────
function RecentItem({ item, index }: { item: any; index: number }) {
  const done   = item.status === 'completed'
  const pColor = getPlatformColor(item.platform)
  const sc     = useSharedValue(1)
  const anim   = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).springify().damping(16).stiffness(180)}>
      <Pressable
        onPressIn={() => { sc.value = withSpring(0.97, { damping: 13, stiffness: 280 }) }}
        onPressOut={() => { sc.value = withSpring(1, { damping: 11, stiffness: 220 }) }}
      >
        <Animated.View style={[s.recentRow, anim]}>
          <View style={s.thumb}>
            {item.thumbnail
              ? <Image source={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.blueDim, alignItems: 'center', justifyContent: 'center' }]}>
                  <Feather name="film" size={14} color={C.blue} />
                </View>
            }
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFill} />
            <View style={[s.platBadge, { backgroundColor: pColor + '22' }]}>
              <PlatformChip name={item.platform} size={12} />
            </View>
          </View>

          <View style={s.recentInfo}>
            <Text style={s.recentTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
            <View style={s.recentMeta}>
              <Text style={[s.recentPlatform, { color: pColor }]}>{item.platform}</Text>
              <Text style={s.recentDot}>·</Text>
              <Text style={s.recentType}>{item.type === 'video' ? 'Video' : 'Photo'}</Text>
              {item.fileSize > 0 && (
                <>
                  <Text style={s.recentDot}>·</Text>
                  <Text style={s.recentType}>{formatFileSize(item.fileSize)}</Text>
                </>
              )}
            </View>
          </View>

          <View style={[s.badge, { backgroundColor: done ? C.successDim : C.errorDim }]}>
            <Feather name={done ? 'check' : 'x'} size={11} color={done ? C.success : C.error} />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

// ── Platform chip pressable ───────────────────────────────────
function PlatCard({ name, onPress }: { name: string; onPress: () => void }) {
  const sc = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { sc.value = withSpring(0.90, { damping: 12, stiffness: 300 }) }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 10, stiffness: 240 }) }}
    >
      <Animated.View style={anim}>
        <Card radius={16} style={s.platformCard}>
          <PlatformChip name={name} size={36} showLabel />
        </Card>
      </Animated.View>
    </Pressable>
  )
}

// ── Main screen ───────────────────────────────────────────────
export default function HomeScreen() {
  const insets  = useSafeAreaInsets()
  const router  = useRouter()
  const history = useStore(s => s.history)
  const recent  = history.slice(0, 6)

  const goPaste   = useCallback(() => router.navigate('/paste' as any), [router])
  const goHistory = useCallback(() => router.navigate('/history' as any), [router])

  const totalToday = history.filter(h =>
    new Date(h.downloadedAt).toDateString() === new Date().toDateString()
  ).length

  const successPct = history.length > 0
    ? Math.round(history.filter(h => h.status === 'completed').length / history.length * 100)
    : 100

  // Hero count-up animation
  const heroNum = useSharedValue(0)
  useEffect(() => {
    heroNum.value = withDelay(300, withTiming(history.length, { duration: 1100, easing: Easing.out(Easing.cubic) }))
  }, [history.length])

  const dlBtnSc = useSharedValue(1)

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Bg />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

        {/* ── Header ── */}
        <FadeSection delay={0} style={[s.header, { paddingTop: insets.top + 18 }]}>
          <View>
            <Text style={s.appName}>SaveFlow</Text>
            <Text style={s.appSub}>Video & Photo Downloader</Text>
          </View>
          <Pressable
            onPress={goPaste}
            onPressIn={() => { dlBtnSc.value = withSpring(0.88, { damping: 12, stiffness: 300 }) }}
            onPressOut={() => { dlBtnSc.value = withSpring(1, { damping: 10, stiffness: 240 }) }}
          >
            <Animated.View style={[s.dlBtn, useAnimatedStyle(() => ({ transform: [{ scale: dlBtnSc.value }] }))]}>
              <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Feather name="download" size={18} color="#fff" />
            </Animated.View>
          </Pressable>
        </FadeSection>
        {/* ── Hero card ── */}
        <FadeSection delay={60} style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Card radius={24} glow glowColor="rgba(79,128,255,0.30)" noPad>
            <LinearGradient
              colors={['rgba(79,128,255,0.20)', 'rgba(0,204,171,0.10)', 'rgba(10,13,26,0.0)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.heroGrad}
            >
              {/* Glow orb */}
              <View style={s.heroOrb}>
                <PulseGlow color="rgba(79,128,255,0.22)" size={110} />
              </View>

              <View style={s.heroLeft}>
                <Text style={s.heroLabel}>Total Downloads</Text>
                <AnimNum value={history.length} style={s.heroNum} />
                <View style={s.heroChange}>
                  <Feather name="trending-up" size={11} color={C.teal} />
                  <Text style={s.heroChangeTxt}>{totalToday} today</Text>
                </View>
              </View>

              <View style={s.heroRight}>
                <View style={s.heroIconWrap}>
                  <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                  <Feather name="download-cloud" size={30} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </Card>
        </FadeSection>

        {/* ── Stats row ── */}
        <FadeSection delay={120} style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={s.statsRow}>
            <StatCard label="Today"   value={totalToday}       icon="calendar"    color={C.blue}   delay={0}   />
            <StatCard label="Success" value={`${successPct}%`} icon="check-circle" color={C.teal}  delay={60}  />
            <StatCard label="Total"   value={history.length}   icon="archive"     color="#FBBF24"  delay={120} />
          </View>
        </FadeSection>

        {/* ── Quick download card ── */}
        <FadeSection delay={160} style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Pressable onPress={goPaste}>
            <Card radius={18} glow glowColor={C.blueGlow} noPad>
              <LinearGradient colors={['rgba(79,128,255,0.14)', 'rgba(0,204,171,0.07)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.quickCard}>
                <View style={s.quickLeft}>
                  <View style={s.quickIconWrap}>
                    <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
                    <Feather name="link-2" size={18} color="#fff" />
                  </View>
                  <View>
                    <Text style={s.quickTitle}>Download Now</Text>
                    <Text style={s.quickSub}>Paste a link from any platform</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={C.white40} />
              </LinearGradient>
            </Card>
          </Pressable>
        </FadeSection>

        {/* ── Platforms ── */}
        <FadeSection delay={200}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Supported Platforms</Text>
            <Pressable onPress={goPaste}>
              <Text style={s.seeAll}>1000+ ›</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.platformScroll}
          >
            {PLATFORMS.map((name, i) => (
              <Animated.View
                key={name}
                entering={ZoomIn.delay(i * 40).springify().damping(14)}
              >
                <PlatCard name={name} onPress={goPaste} />
              </Animated.View>
            ))}
          </ScrollView>
        </FadeSection>

        {/* ── Recent downloads ── */}
        <FadeSection delay={280} style={{ marginTop: 28 }}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Recent Downloads</Text>
            {history.length > 0 && (
              <Pressable onPress={goHistory}>
                <Text style={s.seeAll}>See All ›</Text>
              </Pressable>
            )}
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <Card radius={20} noPad>
              {recent.length === 0 ? (
                <View style={s.emptyWrap}>
                  <View style={s.emptyIcon}>
                    <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                    <Feather name="download" size={24} color="#fff" />
                  </View>
                  <Text style={s.emptyTitle}>No downloads yet</Text>
                  <Text style={s.emptySub}>Paste a video link to get started</Text>
                  <Pressable onPress={goPaste} style={s.emptyBtn}>
                    <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
                    <Text style={s.emptyBtnTxt}>Start Downloading</Text>
                  </Pressable>
                </View>
              ) : (
                recent.map((item, i) => (
                  <View key={item.id}>
                    <RecentItem item={item} index={i} />
                    {i < recent.length - 1 && <View style={s.divider} />}
                  </View>
                ))
              )}
            </Card>
          </View>
        </FadeSection>

      </ScrollView>
    </View>
  )
}
const s = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 22 },
  appName:       { fontSize: 26, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.5 },
  appSub:        { fontSize: 12, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 },
  dlBtn:         { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, shadowOpacity: 0.5, elevation: 12 },

  heroGrad:      { padding: 22, flexDirection: 'row', alignItems: 'center', borderRadius: 24, overflow: 'hidden', minHeight: 130 },
  heroOrb:       { position: 'absolute', right: -20, top: -20, alignItems: 'center', justifyContent: 'center' },
  heroLeft:      { flex: 1, gap: 5 },
  heroLabel:     { fontSize: 12, color: C.white60, fontFamily: 'PlusJakartaSans_500Medium' },
  heroNum:       { fontSize: 44, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -2 },
  heroChange:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  heroChangeTxt: { fontSize: 12, color: C.teal, fontFamily: 'PlusJakartaSans_600SemiBold' },
  heroRight:     { alignItems: 'center', justifyContent: 'center' },
  heroIconWrap:  { width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowRadius: 18, shadowOpacity: 0.5, elevation: 14 },

  statsRow:      { flexDirection: 'row', gap: 10 },
  statCard:      { alignItems: 'center', paddingVertical: 16, gap: 6 },
  statIcon:      { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statVal:       { fontSize: 20, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.5 },
  statLbl:       { fontSize: 10, color: C.white40, fontFamily: 'PlusJakartaSans_500Medium' },

  quickCard:     { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, gap: 14 },
  quickLeft:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  quickTitle:    { fontSize: 15, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  quickSub:      { fontSize: 11, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 },

  sectionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.3 },
  seeAll:        { fontSize: 13, color: C.teal, fontFamily: 'PlusJakartaSans_600SemiBold' },

  platformScroll:{ paddingHorizontal: 20, gap: 10 },
  platformCard:  { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, minWidth: 80 },

  recentRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  thumb:         { width: 54, height: 54, borderRadius: 13, overflow: 'hidden', backgroundColor: C.blueDim, flexShrink: 0 },
  platBadge:     { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  recentInfo:    { flex: 1, gap: 5 },
  recentTitle:   { fontSize: 13, fontWeight: '600', color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  recentMeta:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recentPlatform:{ fontSize: 11, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  recentDot:     { fontSize: 10, color: C.white20 },
  recentType:    { fontSize: 11, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },
  badge:         { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  divider:       { height: 1, backgroundColor: C.borderSub, marginHorizontal: 14 },

  emptyWrap:     { alignItems: 'center', paddingVertical: 36, gap: 10 },
  emptyIcon:     { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  emptyTitle:    { fontSize: 15, fontWeight: '700', color: C.white60, fontFamily: 'PlusJakartaSans_700Bold' },
  emptySub:      { fontSize: 12, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },
  emptyBtn:      { marginTop: 8, overflow: 'hidden', paddingHorizontal: 26, paddingVertical: 12, borderRadius: 12 },
  emptyBtnTxt:   { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
})