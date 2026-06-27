import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Dimensions, TextInput, Keyboard, KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
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
import { useDownloader } from '@/hooks/useDownloader'
import { useStore } from '@/store/useStore'
import { isSupportedPlatform, getPlatformName } from '@/utils/urlValidator'
import { C } from '@/constants/colors'
import { formatFileSize, formatSpeed, formatEta } from '@/utils/fileUtils'
import { MediaInfo, QualityOption } from '@/types'

const { width: W } = Dimensions.get('window')

const PLATFORMS = [
  'YouTube', 'TikTok', 'Instagram', 'Facebook',
  'Twitter', 'Pinterest', 'Reddit', 'Vimeo',
]

// ── Fade + slide ──────────────────────────────────────────────
function Fade({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const op = useSharedValue(0)
  const ty = useSharedValue(20)
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }))
    ty.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 200 }))
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }))
  return <Animated.View style={[anim, style]}>{children}</Animated.View>
}

// ── Animated counter ──────────────────────────────────────────
function Counter({ value, style }: { value: number; style?: any }) {
  const [display, setDisplay] = React.useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) { setDisplay(end); return }
    const step = Math.ceil(end / 30)
    const timer = setInterval(() => {
      start = Math.min(start + step, end)
      setDisplay(start)
      if (start >= end) clearInterval(timer)
    }, 28)
    return () => clearInterval(timer)
  }, [value])
  return <Text style={style}>{display}</Text>
}

// ── Pulse orb ─────────────────────────────────────────────────
function Pulse({ color, size = 100 }: { color: string; size?: number }) {
  const op = useSharedValue(0.2)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.2,  { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ), -1,
    )
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value }))
  return (
    <Animated.View
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, anim]}
    />
  )
}

// ── Shimmer skeleton ──────────────────────────────────────────
function Shimmer() {
  const glow = useSharedValue(0)
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ), -1,
    )
  }, [])
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.04 + glow.value * 0.1 }))
  return (
    <Animated.View entering={FadeInDown.duration(260)} style={{ marginBottom: 12 }}>
      <Card radius={16} noPad>
        <View style={{ height: 80, borderRadius: 16, overflow: 'hidden', backgroundColor: C.white06, justifyContent: 'center', padding: 16 }}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.blue }, glowStyle]} />
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.white10 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <Animated.View style={[{ height: 10, borderRadius: 5, backgroundColor: C.white10, width: '68%' }, glowStyle]} />
              <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: C.white10, width: '40%' }, glowStyle]} />
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  )
}

// ── Animated progress bar ─────────────────────────────────────
function ProgBar({ progress }: { progress: number }) {
  const w = useSharedValue(0)
  useEffect(() => {
    w.value = withTiming(progress, { duration: 480, easing: Easing.out(Easing.cubic) })
  }, [progress])
  const fillStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, w.value))}%` as any }))
  return (
    <View style={{ height: 5, backgroundColor: C.white10, borderRadius: 5, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 5, minWidth: 4, overflow: 'hidden' }, fillStyle]}>
        <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  )
}

// ── Quality pill ──────────────────────────────────────────────
function QualPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const sc = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { sc.value = withSpring(0.92, { damping: 13, stiffness: 300 }) }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 11, stiffness: 240 }) }}
    >
      <Animated.View style={[s.qualPill, active && s.qualPillOn, anim]}>
        {active && (
          <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 50 }]} />
        )}
        <Text style={[s.qualTxt, active && s.qualTxtOn]}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

// ── Success card ──────────────────────────────────────────────
function SuccessCard({ onDismiss }: { onDismiss: () => void }) {
  const sc = useSharedValue(0.75)
  const op = useSharedValue(0)
  useEffect(() => {
    sc.value = withSpring(1, { damping: 12, stiffness: 220 })
    op.value = withTiming(1, { duration: 300 })
  }, [])
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: op.value }))
  return (
    <Animated.View style={[{ marginBottom: 14 }, anim]}>
      <Card radius={20} noPad>
        <LinearGradient colors={['rgba(34,211,164,0.14)', 'rgba(0,168,130,0.06)']}
          style={{ borderRadius: 20, padding: 28, alignItems: 'center', gap: 12 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.successDim, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={28} color={C.success} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' }}>Download Selesai!</Text>
          <Text style={{ fontSize: 13, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' }}>Tersimpan ke galeri kamu</Text>
          <Pressable onPress={onDismiss} style={s.dismissBtn}>
            <Text style={{ fontSize: 13, color: C.white60, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Download Lagi</Text>
          </Pressable>
        </LinearGradient>
      </Card>
    </Animated.View>
  )
}

// ── Stat mini card ────────────────────────────────────────────
function StatMini({ icon, value, label, color, delay }: {
  icon: string; value: string | number; label: string; color: string; delay: number
}) {
  const sc = useSharedValue(1)
  return (
    <Fade delay={delay} style={{ flex: 1 }}>
      <Pressable
        onPressIn={() => { sc.value = withSpring(0.93, { damping: 13, stiffness: 280 }) }}
        onPressOut={() => { sc.value = withSpring(1, { damping: 11, stiffness: 220 }) }}
      >
        <Animated.View style={[useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))]}>
          <Card radius={16} style={s.miniCard}>
            <View style={[s.miniIcon, { backgroundColor: color + '20' }]}>
              <Feather name={icon as any} size={14} color={color} />
            </View>
            <Text style={s.miniVal}>{value}</Text>
            <Text style={s.miniLbl}>{label}</Text>
          </Card>
        </Animated.View>
      </Pressable>
    </Fade>
  )
}

// ── Platform card ─────────────────────────────────────────────
function PlatCard({ name, onPress }: { name: string; onPress: () => void }) {
  const sc = useSharedValue(1)
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { sc.value = withSpring(0.90, { damping: 13, stiffness: 300 }) }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 11, stiffness: 240 }) }}
    >
      <Animated.View style={useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))}>
        <Card radius={16} style={s.platCard}>
          <PlatformChip name={name} size={34} showLabel />
        </Card>
      </Animated.View>
    </Pressable>
  )
}

// ── Recent row ────────────────────────────────────────────────
function RecentRow({ item, index }: { item: any; index: number }) {
  const done   = item.status === 'completed'
  const pColor = getPlatformColor(item.platform)
  const sc     = useSharedValue(1)
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18).stiffness(180)}>
      <Pressable
        onPressIn={() => { sc.value = withSpring(0.97, { damping: 14, stiffness: 300 }) }}
        onPressOut={() => { sc.value = withSpring(1, { damping: 12, stiffness: 240 }) }}
      >
        <Animated.View style={[s.recentRow, useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))]}>
          <View style={s.thumb}>
            {item.thumbnail
              ? <Image source={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.blueDim, alignItems: 'center', justifyContent: 'center' }]}>
                  <Feather name="film" size={14} color={C.blue} />
                </View>
            }
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
          </View>
          <View style={s.recentInfo}>
            <Text style={s.recentTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
            <View style={s.recentMeta}>
              <Text style={[s.recentPlat, { color: pColor }]}>{item.platform}</Text>
              <Text style={s.dot}>·</Text>
              <Text style={s.recentType}>{item.type === 'video' ? 'Video' : 'Foto'}</Text>
              {item.fileSize > 0 && <>
                <Text style={s.dot}>·</Text>
                <Text style={s.recentType}>{formatFileSize(item.fileSize)}</Text>
              </>}
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

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function HomeScreen() {
  const insets  = useSafeAreaInsets()
  const router  = useRouter()

  // Store
  const history        = useStore(st => st.history)
  const activeDownloads = useStore(st => st.activeDownloads)
  const recent         = history.slice(0, 5)

  // Download state
  const [url,     setUrl]     = useState('')
  const [quality, setQuality] = useState('720')
  const [info,    setInfo]    = useState<MediaInfo | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const { fetchInfo, analyzeAndDownload, isAnalyzing, isDownloading, analyzeError, currentId, clearError, clearInfo } = useDownloader()

  const currentDl  = currentId ? activeDownloads[currentId] : null
  const dlProgress = currentDl?.progress ?? 0
  const dlSpeed    = currentDl?.speed    ?? 0
  const dlEta      = currentDl?.eta      ?? 0

  const isValid  = isSupportedPlatform(url)
  const platform = isValid ? getPlatformName(url) : null
  const pColor   = platform ? getPlatformColor(platform) : C.blue
  const isActive = isDownloading || isAnalyzing

  const availableQualities: QualityOption[] =
    info?.supportedQualities?.length
      ? info.supportedQualities
      : [
          { label: '1080p', value: '1080' },
          { label: '720p',  value: '720'  },
          { label: '480p',  value: '480'  },
          { label: '360p',  value: '360'  },
        ]

  useEffect(() => {
    if (info?.supportedQualities?.length) setQuality(info.supportedQualities[0].value)
  }, [info])

  useEffect(() => {
    if (!isValid) { setInfo(null); return }
    const t = setTimeout(async () => {
      const r = await fetchInfo(url)
      if (r) setInfo(r)
    }, 800)
    return () => clearTimeout(t)
  }, [url, isValid])

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync()
    if (text) {
      setUrl(text); setInfo(null); setSuccess(false); clearError()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [clearError])

  const handleClear = useCallback(() => {
    setUrl(''); setInfo(null); setSuccess(false); clearError(); clearInfo()
  }, [clearError, clearInfo])

  const handleDownload = useCallback(async () => {
    if (!url || !isValid || isActive) return
    Keyboard.dismiss()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      await analyzeAndDownload(url, quality)
      setSuccess(true); setUrl(''); setInfo(null); clearInfo()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {}
  }, [url, isValid, quality, isActive, analyzeAndDownload, clearInfo])

  const handleDismissSuccess = useCallback(() => {
    setSuccess(false)
  }, [])

  const goHistory = useCallback(() => router.navigate('/history' as any), [router])

  // Stats
  const totalToday = history.filter(h =>
    new Date(h.downloadedAt).toDateString() === new Date().toDateString()
  ).length
  const successPct = history.length > 0
    ? Math.round(history.filter(h => h.status === 'completed').length / history.length * 100)
    : 100

  // Input border color animation
  const borderClr = useSharedValue(C.border)
  const inputBorderStyle = useAnimatedStyle(() => ({ borderColor: borderClr.value }))

  // Download button glow
  const btnGlow = useSharedValue(0.5)
  useEffect(() => {
    btnGlow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5,  { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ), -1,
    )
  }, [])
  const dlBtnStyle = useAnimatedStyle(() => ({
    shadowOpacity: isValid ? btnGlow.value : 0.28,
  }))

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Bg />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Header ── */}
          <Fade delay={0} style={[s.header, { paddingTop: insets.top + 20 }]}>
            <View>
              <Text style={s.appName}>SaveFlow</Text>
              <Text style={s.appSub}>Video & Photo Downloader</Text>
            </View>
            <Pressable onPress={handlePaste} style={s.headerBtn}>
              <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Feather name="download" size={18} color="#fff" />
            </Pressable>
          </Fade>

          {/* ── Hero ── */}
          <Fade delay={60} style={{ paddingHorizontal: 18, marginBottom: 16 }}>
            <Card radius={22} glow glowColor="rgba(79,128,255,0.28)" noPad>
              <LinearGradient
                colors={['rgba(79,128,255,0.18)', 'rgba(0,204,171,0.08)', 'rgba(7,9,28,0)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.heroGrad}
              >
                <View style={s.heroOrb}>
                  <Pulse color="rgba(79,128,255,0.20)" size={120} />
                </View>
                <View style={s.heroLeft}>
                  <Text style={s.heroLbl}>Total Downloads</Text>
                  <Counter value={history.length} style={s.heroNum} />
                  <View style={s.heroChange}>
                    <Feather name="trending-up" size={11} color={C.teal} />
                    <Text style={s.heroChangeTxt}>{totalToday} hari ini</Text>
                  </View>
                </View>
                <View style={s.heroRight}>
                  <View style={s.heroIcon}>
                    <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                    <Feather name="download-cloud" size={30} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
            </Card>
          </Fade>

          {/* ── Stats row ── */}
          <Fade delay={100} style={{ paddingHorizontal: 18, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatMini icon="calendar"     value={totalToday}       label="Hari Ini"  color={C.blue}    delay={0}   />
              <StatMini icon="check-circle" value={`${successPct}%`} label="Sukses"    color={C.teal}    delay={50}  />
              <StatMini icon="archive"      value={history.length}   label="Total"     color="#FBBF24"   delay={100} />
            </View>
          </Fade>

          {/* ── Download section ── */}
          <Fade delay={140} style={{ paddingHorizontal: 18, marginBottom: 20 }}>
            <Text style={s.sectionTitle}>Download</Text>
            <Text style={[s.sectionSub, { marginBottom: 12 }]}>Paste link dari platform manapun</Text>

            {/* URL input */}
            <Animated.View style={[s.inputCard, inputBorderStyle]}>
              <View style={[s.inputIcon, { backgroundColor: isValid ? pColor + '1A' : C.white06 }]}>
                <Feather name="link-2" size={16} color={isValid ? pColor : C.white40} />
              </View>
              <TextInput
                ref={inputRef}
                style={s.input}
                value={url}
                onChangeText={t => { setUrl(t); setInfo(null); setSuccess(false); clearError() }}
                placeholder="Paste link video disini…"
                placeholderTextColor={C.white20}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                editable={!isActive}
                onFocus={() => { borderClr.value = withTiming(pColor, { duration: 220 }) }}
                onBlur={() => { borderClr.value = withTiming(C.border, { duration: 220 }) }}
              />
              {url.length > 0
                ? <Pressable onPress={handleClear} style={s.inputAction} disabled={isActive}>
                    <Feather name="x" size={14} color={C.white40} />
                  </Pressable>
                : <Pressable onPress={handlePaste} style={s.pasteBtn}>
                    <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[StyleSheet.absoluteFill, { borderRadius: 10 }]} />
                    <Feather name="clipboard" size={13} color="#fff" />
                    <Text style={s.pasteTxt}>Paste</Text>
                  </Pressable>
              }
            </Animated.View>

            {/* Platform detected */}
            {isValid && platform && !isActive && (
              <Animated.View entering={FadeInDown.springify().damping(16)} style={{ marginTop: 10 }}>
                <Card radius={12} noPad>
                  <View style={s.platRow}>
                    <Animated.View entering={ZoomIn.springify().damping(14)}>
                      <PlatformChip name={platform} size={28} />
                    </Animated.View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.platLbl}>Terdeteksi</Text>
                      <Text style={[s.platName, { color: pColor }]}>{platform}</Text>
                    </View>
                    <View style={s.platCheck}>
                      <Feather name="check" size={12} color={C.success} />
                    </View>
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Error */}
            {analyzeError && !isActive && (
              <Animated.View entering={FadeInDown.springify().damping(16)} style={{ marginTop: 10 }}>
                <Card radius={12} noPad style={{ backgroundColor: C.errorDim }}>
                  <View style={s.errRow}>
                    <Feather name="alert-circle" size={14} color={C.error} />
                    <Text style={s.errTxt} numberOfLines={2}>{analyzeError}</Text>
                    <Pressable onPress={clearError} hitSlop={10}>
                      <Feather name="x" size={13} color={C.error} />
                    </Pressable>
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Shimmer */}
            {isAnalyzing && !isDownloading && (
              <View style={{ marginTop: 10 }}>
                <Shimmer />
              </View>
            )}

            {/* Preview card */}
            {info && !isActive && !success && (
              <Animated.View entering={FadeInDown.springify().damping(16)} style={{ marginTop: 10 }}>
                <Card radius={16} noPad>
                  {info.thumbnail ? (
                    <View style={s.thumbWrap}>
                      <Image source={info.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <LinearGradient colors={['transparent', 'rgba(7,9,28,0.92)']} style={StyleSheet.absoluteFill} />
                      <View style={s.thumbMeta}>
                        {platform && <PlatformChip name={platform} size={20} />}
                        <View style={{ flex: 1 }}>
                          <Text style={s.thumbTitle} numberOfLines={2}>{info.title}</Text>
                          <Text style={s.thumbSub}>{info.type === 'gallery' ? `${info.urls.length} item` : platform}</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={s.noThumb}>
                      <Feather name="video" size={26} color={C.blue} />
                      <Text style={s.noThumbTxt} numberOfLines={2}>{info.title || 'Video'}</Text>
                    </View>
                  )}
                </Card>
              </Animated.View>
            )}

            {/* Quality */}
            {(info || isValid) && !isActive && !success && (
              <Animated.View entering={FadeInDown.delay(50).springify().damping(16)} style={{ marginTop: 14 }}>
                <Text style={s.qualLabel}>Kualitas</Text>
                <View style={s.qualRow}>
                  {availableQualities.map((q, i) => (
                    <Animated.View key={q.value} entering={FadeInDown.delay(i * 40).springify()}>
                      <QualPill
                        label={q.label}
                        active={quality === q.value}
                        onPress={() => { setQuality(q.value); Haptics.selectionAsync() }}
                      />
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Download button */}
            {isValid && !isActive && !success && (
              <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={{ marginTop: 14 }}>
                <Pressable
                  onPress={handleDownload}
                  onPressIn={() => {}}
                  onPressOut={() => {}}
                  disabled={isActive}
                >
                  <Animated.View style={[s.dlBtn, dlBtnStyle]}>
                    <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
                    <Feather name="download" size={18} color="#fff" />
                    <Text style={s.dlBtnTxt}>Download Sekarang</Text>
                  </Animated.View>
                </Pressable>
              </Animated.View>
            )}

            {/* Progress */}
            {isDownloading && currentDl && (
              <Animated.View entering={FadeInDown.springify().damping(16)} style={{ marginTop: 14 }}>
                <Card radius={18} glow glowColor={C.blueGlow} noPad>
                  <View style={s.progHeader}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue }} />
                    <Text style={s.progLabel}>Mengunduh…</Text>
                    <Text style={s.progPct}>{dlProgress}%</Text>
                  </View>
                  <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                    <ProgBar progress={dlProgress} />
                  </View>
                  <View style={s.progStats}>
                    {[
                      { label: 'Kecepatan', val: dlSpeed > 0 ? formatSpeed(dlSpeed) : '—' },
                      { label: 'Sisa',      val: dlEta   > 0 ? formatEta(dlEta)     : '—' },
                      { label: 'Ukuran',    val: (currentDl.totalBytes ?? 0) > 0 ? formatFileSize(currentDl.totalBytes ?? 0) : '—' },
                    ].map((st, i) => (
                      <View key={i} style={[s.progStat, i < 2 && { borderRightWidth: 1, borderRightColor: C.white10 }]}>
                        <Text style={s.progStatVal}>{st.val}</Text>
                        <Text style={s.progStatLbl}>{st.label}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Success */}
            {success && (
              <View style={{ marginTop: 14 }}>
                <SuccessCard onDismiss={handleDismissSuccess} />
              </View>
            )}
          </Fade>

          {/* ── Platforms ── */}
          <Fade delay={200}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Platform Didukung</Text>
              <Text style={s.seeAll}>1000+ ›</Text>
            </View>
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}
            >
              {PLATFORMS.map((name, i) => (
                <Animated.View key={name} entering={ZoomIn.delay(i * 35).springify().damping(14)}>
                  <PlatCard name={name} onPress={() => {
                    inputRef.current?.focus()
                  }} />
                </Animated.View>
              ))}
            </ScrollView>
          </Fade>

          {/* ── Recent downloads ── */}
          <Fade delay={260} style={{ marginTop: 26 }}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Download Terbaru</Text>
              {history.length > 0 && (
                <Pressable onPress={goHistory}>
                  <Text style={s.seeAll}>Lihat Semua ›</Text>
                </Pressable>
              )}
            </View>
            <View style={{ paddingHorizontal: 18 }}>
              <Card radius={20} noPad>
                {recent.length === 0 ? (
                  <View style={s.emptyWrap}>
                    <View style={s.emptyIcon}>
                      <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                      <Feather name="download" size={24} color="#fff" />
                    </View>
                    <Text style={s.emptyTitle}>Belum ada download</Text>
                    <Text style={s.emptySub}>Paste link video untuk mulai</Text>
                  </View>
                ) : (
                  recent.map((item, i) => (
                    <View key={item.id}>
                      <RecentRow item={item} index={i} />
                      {i < recent.length - 1 && <View style={s.divider} />}
                    </View>
                  ))
                )}
              </Card>
            </View>
          </Fade>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 20 },
  appName:    { fontSize: 26, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.5 },
  appSub:     { fontSize: 12, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 },
  headerBtn:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, shadowOpacity: 0.45, elevation: 12 },

  heroGrad:   { padding: 22, flexDirection: 'row', alignItems: 'center', borderRadius: 22, overflow: 'hidden', minHeight: 128 },
  heroOrb:    { position: 'absolute', right: -20, top: -20, alignItems: 'center', justifyContent: 'center' },
  heroLeft:   { flex: 1, gap: 5 },
  heroLbl:    { fontSize: 12, color: C.white60, fontFamily: 'PlusJakartaSans_500Medium' },
  heroNum:    { fontSize: 48, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -2 },
  heroChange: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  heroChangeTxt: { fontSize: 12, color: C.teal, fontFamily: 'PlusJakartaSans_600SemiBold' },
  heroRight:  { alignItems: 'center', justifyContent: 'center' },
  heroIcon:   { width: 66, height: 66, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowRadius: 18, shadowOpacity: 0.5, elevation: 14 },

  miniCard:   { alignItems: 'center', paddingVertical: 15, gap: 6 },
  miniIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  miniVal:    { fontSize: 20, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.4 },
  miniLbl:    { fontSize: 10, color: C.white40, fontFamily: 'PlusJakartaSans_500Medium' },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.3 },
  sectionSub:   { fontSize: 12, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', paddingHorizontal: 0 },
  seeAll:       { fontSize: 13, color: C.teal, fontFamily: 'PlusJakartaSans_600SemiBold' },

  inputCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 10, gap: 10, height: 52 },
  inputIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  input:        { flex: 1, fontSize: 14, color: '#fff', fontFamily: 'PlusJakartaSans_400Regular' },
  inputAction:  { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  pasteBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, overflow: 'hidden' },
  pasteTxt:     { fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

  platRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  platLbl:      { fontSize: 10, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },
  platName:     { fontSize: 14, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  platCheck:    { width: 26, height: 26, borderRadius: 8, backgroundColor: C.successDim, alignItems: 'center', justifyContent: 'center' },

  errRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  errTxt:       { flex: 1, fontSize: 12, color: C.error, fontFamily: 'PlusJakartaSans_400Regular' },

  thumbWrap:    { height: 140, borderRadius: 16, overflow: 'hidden' },
  thumbMeta:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  thumbTitle:   { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  thumbSub:     { fontSize: 11, color: C.white60, fontFamily: 'PlusJakartaSans_400Regular' },
  noThumb:      { padding: 20, alignItems: 'center', gap: 10 },
  noThumbTxt:   { fontSize: 13, color: C.white60, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' },

  qualLabel:    { fontSize: 12, color: C.white40, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  qualRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualPill:     { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, overflow: 'hidden' },
  qualPillOn:   { borderColor: 'transparent' },
  qualTxt:      { fontSize: 13, fontWeight: '600', color: C.white40, fontFamily: 'PlusJakartaSans_600SemiBold' },
  qualTxtOn:    { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

  dlBtn:        { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, overflow: 'hidden', shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowRadius: 18, elevation: 14 },
  dlBtnTxt:     { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  dismissBtn:   { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.white10 },

  progHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 10 },
  progLabel:    { flex: 1, fontSize: 13, fontWeight: '700', color: C.blueLight, fontFamily: 'PlusJakartaSans_700Bold' },
  progPct:      { fontSize: 15, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  progStats:    { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, marginTop: 2 },
  progStat:     { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  progStatVal:  { fontSize: 14, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  progStatLbl:  { fontSize: 10, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },

  platCard:     { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, minWidth: 82 },

  recentRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  thumb:        { width: 52, height: 52, borderRadius: 12, overflow: 'hidden', backgroundColor: C.blueDim, flexShrink: 0 },
  recentInfo:   { flex: 1, gap: 4 },
  recentTitle:  { fontSize: 13, fontWeight: '600', color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  recentMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentPlat:   { fontSize: 11, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  dot:          { fontSize: 10, color: C.white20 },
  recentType:   { fontSize: 11, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },
  badge:        { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  divider:      { height: 1, backgroundColor: C.borderSub, marginHorizontal: 14 },

  emptyWrap:    { alignItems: 'center', paddingVertical: 36, gap: 10 },
  emptyIcon:    { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  emptyTitle:   { fontSize: 15, fontWeight: '700', color: C.white60, fontFamily: 'PlusJakartaSans_700Bold' },
  emptySub:     { fontSize: 12, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },
})
