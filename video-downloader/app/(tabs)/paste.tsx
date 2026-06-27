import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, Keyboard, KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  FadeInDown,
  FadeOutUp,
  ZoomIn,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import Bg from '@/components/Bg'
import Card from '@/components/Card'
import { PlatformChip, getPlatformColor } from '@/components/PlatformChip'
import { useDownloader } from '@/hooks/useDownloader'
import { useStore } from '@/store/useStore'
import { isSupportedPlatform, getPlatformName } from '@/utils/urlValidator'
import { C, G } from '@/constants/colors'
import { formatFileSize, formatSpeed, formatEta } from '@/utils/fileUtils'
import { MediaInfo, QualityOption } from '@/types'

// ── Pulse dot ─────────────────────────────────────────────────
function PulseDot({ color = C.blue }: { color?: string }) {
  const op = useSharedValue(1)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ), -1, false,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value }))
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, style]} />
}

// ── Shimmer skeleton ──────────────────────────────────────────
function ShimmerSkeleton() {
  const sh = useSharedValue(0)
  useEffect(() => {
    sh.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      ), -1, false,
    )
  }, [])
  const glow = useAnimatedStyle(() => ({ opacity: 0.04 + sh.value * 0.12 }))
  return (
    <Animated.View entering={FadeInDown.duration(280)} style={{ paddingHorizontal: 20, marginBottom: 14 }}>
      <Card radius={18} noPad>
        <View style={sk.wrap}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#7BA5FF', borderRadius: 18 }, glow]} />
          <View style={sk.row}>
            <View style={sk.icon} />
            <View style={sk.lines}>
              <Animated.View style={[sk.line, { width: '70%' }, glow]} />
              <Animated.View style={[sk.line, { width: '40%', marginTop: 10 }, glow]} />
            </View>
          </View>
        </View>
   nya   </Card>
    </Animated.View>
  )
}
const sk = StyleSheet.create({
  wrap:  { height: 88, borderRadius: 18, overflow: 'hidden', backgroundColor: C.white06, justifyContent: 'center' },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  icon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: C.white10 },
  lines: { flex: 1 },
  line:  { height: 10, borderRadius: 5, backgroundColor: C.white10 },
})

// ── Animated progress bar ─────────────────────────────────────
function AnimBar({ progress }: { progress: number }) {
  const w = useSharedValue(0)
  const sh = useSharedValue(0)
  useEffect(() => {
    w.value = withTiming(progress, { duration: 500, easing: Easing.out(Easing.cubic) })
  }, [progress])
  useEffect(() => {
    sh.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ), -1, false,
    )
  }, [])
  const fillStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, w.value))}%` }))
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.28 + sh.value * 0.42 }))
  return (
    <View style={pb.track}>
      <Animated.View style={[pb.fill, fillStyle]}>
        <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }, glowStyle]} />
      </Animated.View>
    </View>
  )
}
const pb = StyleSheet.create({
  track: { height: 5, backgroundColor: C.white10, borderRadius: 5, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 5, minWidth: 5, overflow: 'hidden' },
})
// ── Quality pill ──────────────────────────────────────────────
function QualPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const sc = useSharedValue(1)
  const pressIn  = () => { sc.value = withSpring(0.92, { damping: 13, stiffness: 300 }) }
  const pressOut = () => { sc.value = withSpring(1,    { damping: 11, stiffness: 240 }) }
  const style = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[p.qualPill, active && p.qualPillActive, style]}>
        {active && (
          <LinearGradient
            colors={['#4F80FF', '#00CCAB']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 50 }]}
          />
        )}
        <Text style={[p.qualTxt, active && p.qualTxtActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

// ── Download button ───────────────────────────────────────────
function DownloadButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const sc   = useSharedValue(1)
  const glow = useSharedValue(0.55)
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.82, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.55, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    )
  }, [])
  const scStyle   = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  const glowStyle = useAnimatedStyle(() => ({ shadowOpacity: glow.value }))
  return (
    <Pressable
      onPress={onPress} disabled={disabled}
      onPressIn={() => { sc.value = withSpring(0.94, { damping: 12, stiffness: 260 }) }}
      onPressOut={() => { sc.value = withSpring(1,   { damping: 10, stiffness: 220 }) }}
    >
      <Animated.View style={[p.dlBtn, glowStyle, scStyle]}>
        <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
        <Feather name="download" size={19} color="#fff" />
        <Text style={p.dlBtnTxt}>Download Now</Text>
      </Animated.View>
    </Pressable>
  )
}

// ── Success state ─────────────────────────────────────────────
function SuccessCard() {
  const sc  = useSharedValue(0.7)
  const op  = useSharedValue(0)
  useEffect(() => {
    sc.value = withSpring(1, { damping: 10, stiffness: 200 })
    op.value = withTiming(1, { duration: 350 })
  }, [])
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }], opacity: op.value,
  }))
  return (
    <Animated.View style={[{ paddingHorizontal: 20, marginBottom: 14 }, style]}>
      <Card radius={20} noPad>
        <LinearGradient colors={['rgba(34,211,164,0.12)', 'rgba(0,168,130,0.06)']} style={{ borderRadius: 20, padding: 28, alignItems: 'center', gap: 12 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.successDim, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={28} color={C.success} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' }}>Download Complete!</Text>
          <Text style={{ fontSize: 13, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' }}>Saved to your gallery</Text>
        </LinearGradient>
      </Card>
    </Animated.View>
  )
}
// ── Main screen ───────────────────────────────────────────────
export default function PasteScreen() {
  const insets  = useSafeAreaInsets()
  const [url,     setUrl]     = useState('')
  const [quality, setQuality] = useState('720')
  const [info,    setInfo]    = useState<MediaInfo | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const { fetchInfo, analyzeAndDownload, isAnalyzing, isDownloading, analyzeError, currentId, clearError, clearInfo } = useDownloader()
  const activeDownloads = useStore(s => s.activeDownloads)

  const currentDl  = currentId ? activeDownloads[currentId] : null
  const dlProgress = currentDl?.progress ?? 0
  const dlSpeed    = currentDl?.speed ?? 0
  const dlEta      = currentDl?.eta ?? 0

  const isValid  = isSupportedPlatform(url)
  const platform = isValid ? getPlatformName(url) : null
  const pColor   = platform ? getPlatformColor(platform) : C.blue
  const isActive = isDownloading || isAnalyzing

  // Supported qualities from media info, fallback to default list
  const availableQualities: QualityOption[] = info?.supportedQualities && info.supportedQualities.length > 0
    ? info.supportedQualities
    : [
        { label: '1080p', value: '1080' },
        { label: '720p',  value: '720'  },
        { label: '480p',  value: '480'  },
        { label: '360p',  value: '360'  },
      ]

  // Auto-select best quality when info arrives
  useEffect(() => {
    if (info?.supportedQualities && info.supportedQualities.length > 0) {
      setQuality(info.supportedQualities[0].value)
    }
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
      setTimeout(() => setSuccess(false), 5000)
    } catch {}
  }, [url, isValid, quality, isActive, analyzeAndDownload, clearInfo])

  const inputBorderColor = useSharedValue<string>(C.border)
  const inputFocusStyle  = useAnimatedStyle(() => ({
    borderColor: inputBorderColor.value,
  }))

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Bg />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={[p.header, { paddingTop: insets.top + 18 }]}>
            <Text style={p.title}>Download</Text>
            <Text style={p.sub}>Paste a link from any platform</Text>
          </Animated.View>
          {/* URL Input */}
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ paddingHorizontal: 20, marginBottom: 14 }}>
            <Animated.View style={[p.inputCard, inputFocusStyle]}>
              <View style={[p.inputIcon, { backgroundColor: isValid ? pColor + '18' : C.white06 }]}>
                <Feather name="link-2" size={16} color={isValid ? pColor : C.white40} />
              </View>
              <TextInput
                ref={inputRef}
                style={p.input}
                value={url}
                onChangeText={t => { setUrl(t); setInfo(null); setSuccess(false); clearError() }}
                placeholder="Paste your video link here…"
                placeholderTextColor={C.white20}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                editable={!isActive}
                onFocus={() => {
                  inputBorderColor.value = withTiming(pColor, { duration: 250 })
                }}
                onBlur={() => {
                  inputBorderColor.value = withTiming(C.border, { duration: 250 })
                }}
              />
              {url.length > 0
                ? <Pressable onPress={handleClear} style={p.inputAction} disabled={isActive}>
                    <Feather name="x" size={14} color={C.white40} />
                  </Pressable>
                : <Pressable onPress={handlePaste} style={p.pasteAction}>
                    <LinearGradient colors={['#4F80FF', '#00CCAB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
                    <Feather name="clipboard" size={14} color="#fff" />
                    <Text style={p.pasteTxt}>Paste</Text>
                  </Pressable>
              }
            </Animated.View>
          </Animated.View>

          {/* Platform detected */}
          {isValid && platform && !isActive && (
            <Animated.View
              entering={FadeInDown.springify().damping(16)}
              exiting={FadeOutUp.duration(200)}
              style={{ paddingHorizontal: 20, marginBottom: 14 }}
            >
              <Card radius={14} noPad>
                <View style={p.platRow}>
                  <Animated.View entering={ZoomIn.springify().damping(14)}>
                    <PlatformChip name={platform} size={32} />
                  </Animated.View>
                  <View style={{ flex: 1 }}>
                    <Text style={p.platDetectedLbl}>Detected</Text>
                    <Text style={[p.platName, { color: pColor }]}>{platform}</Text>
                  </View>
                  <View style={p.platCheck}>
                    <Feather name="check" size={13} color={C.success} />
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Analyzing shimmer */}
          {isAnalyzing && !isDownloading && <ShimmerSkeleton />}

          {/* Error */}
          {analyzeError && !isActive && (
            <Animated.View
              entering={FadeInDown.springify().damping(16)}
              style={{ paddingHorizontal: 20, marginBottom: 14 }}
            >
              <Card radius={14} noPad style={{ backgroundColor: C.errorDim }}>
                <View style={p.errRow}>
                  <Feather name="alert-circle" size={15} color={C.error} />
                  <Text style={p.errTxt} numberOfLines={3}>{analyzeError}</Text>
                  <Pressable onPress={clearError} hitSlop={10}>
                    <Feather name="x" size={13} color={C.error} />
                  </Pressable>
                </View>
              </Card>
            </Animated.View>
          )}
          {/* Preview card */}
          {info && !isActive && !success && (
            <Animated.View
              entering={FadeInDown.springify().damping(16)}
              style={{ paddingHorizontal: 20, marginBottom: 14 }}
            >
              <Card radius={18} noPad>
                {info.thumbnail ? (
                  <View style={p.thumbWrap}>
                    <Image source={info.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient colors={['transparent', 'rgba(7,9,28,0.92)']} style={StyleSheet.absoluteFill} />
                    <View style={p.thumbMeta}>
                      {platform && <PlatformChip name={platform} size={22} />}
                      <View style={{ flex: 1 }}>
                        <Text style={p.thumbTitle} numberOfLines={2}>{info.title}</Text>
                        <Text style={p.thumbSub}>{info.type === 'gallery' ? `${info.urls.length} items` : platform}</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={p.noThumb}>
                    <Feather name="video" size={28} color={C.blue} />
                    <Text style={p.noThumbTxt} numberOfLines={2}>{info.title || 'Video'}</Text>
                  </View>
                )}
              </Card>
            </Animated.View>
          )}

          {/* Quality selector — dynamic from supportedQualities */}
          {(info || isValid) && !isActive && !success && (
            <Animated.View
              entering={FadeInDown.delay(60).springify().damping(16)}
              style={{ paddingHorizontal: 20, marginBottom: 14 }}
            >
              <Text style={p.qualTitle}>Quality</Text>
              <View style={p.qualRow}>
                {availableQualities.map((q, i) => (
                  <Animated.View key={q.value} entering={FadeInDown.delay(i * 50).springify()}>
                    <QualPill
                      label={q.label}
                      active={quality === q.value}
                      onPress={() => {
                        setQuality(q.value)
                        Haptics.selectionAsync()
                      }}
                    />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Download button */}
          {isValid && !isActive && !success && (
            <Animated.View
              entering={FadeInDown.delay(100).springify().damping(16)}
              style={{ paddingHorizontal: 20, marginBottom: 14 }}
            >
              <DownloadButton onPress={handleDownload} disabled={isActive} />
            </Animated.View>
          )}

          {/* Progress card */}
          {isDownloading && currentDl && (
            <Animated.View
              entering={FadeInDown.springify().damping(16)}
              style={{ paddingHorizontal: 20, marginBottom: 14 }}
            >
              <Card radius={20} glow glowColor={C.blueGlow} noPad>
                <View style={p.progHeader}>
                  <PulseDot color={C.blue} />
                  <Text style={p.progLabel}>Downloading…</Text>
                  <Text style={p.progPct}>{dlProgress}%</Text>
                </View>
                <View style={{ paddingHorizontal: 18, marginBottom: 14 }}>
                  <AnimBar progress={dlProgress} />
                </View>
                <View style={p.statsRow}>
                  {[
                    { label: 'Speed', val: dlSpeed > 0 ? formatSpeed(dlSpeed) : '—' },
                    { label: 'ETA',   val: dlEta   > 0 ? formatEta(dlEta)     : '—' },
                    { label: 'Size',  val: (currentDl.totalBytes ?? 0) > 0 ? formatFileSize(currentDl.totalBytes ?? 0) : '—' },
                  ].map((s, i) => (
                    <View key={i} style={[p.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.white10 }]}>
                      <Text style={p.statVal}>{s.val}</Text>
                      <Text style={p.statLbl}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Success */}
          {success && <SuccessCard />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
const p = StyleSheet.create({
  header:         { paddingHorizontal: 20, paddingBottom: 20 },
  title:          { fontSize: 28, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.6 },
  sub:            { fontSize: 13, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 4 },

  inputCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingRight: 8, paddingLeft: 12, gap: 10, minHeight: 54 },
  inputIcon:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  input:          { flex: 1, fontSize: 14, color: '#fff', fontFamily: 'PlusJakartaSans_400Regular', paddingVertical: 14 },
  inputAction:    { padding: 8 },
  pasteAction:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, overflow: 'hidden' },
  pasteTxt:       { fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

  platRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  platDetectedLbl:{ fontSize: 10, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 2 },
  platName:       { fontSize: 15, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  platCheck:      { width: 26, height: 26, borderRadius: 13, backgroundColor: C.successDim, alignItems: 'center', justifyContent: 'center' },

  errRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  errTxt:         { flex: 1, fontSize: 13, color: C.error, fontFamily: 'PlusJakartaSans_400Regular' },

  thumbWrap:      { height: 160, borderRadius: 18, overflow: 'hidden', backgroundColor: C.bg2 },
  thumbMeta:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  thumbTitle:     { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  thumbSub:       { fontSize: 11, color: C.white60, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 3 },
  noThumb:        { padding: 28, alignItems: 'center', gap: 12 },
  noThumbTxt:     { fontSize: 14, color: C.white60, fontFamily: 'PlusJakartaSans_500Medium', textAlign: 'center' },

  qualTitle:      { fontSize: 13, color: C.white40, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 10, marginLeft: 2 },
  qualRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualPill:       { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 50, borderWidth: 1, borderColor: C.border, overflow: 'hidden', backgroundColor: C.card },
  qualPillActive: { borderColor: 'transparent' },
  qualTxt:        { fontSize: 13, fontWeight: '600', color: C.white40, fontFamily: 'PlusJakartaSans_600SemiBold' },
  qualTxtActive:  { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

  dlBtn:          { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, overflow: 'hidden', shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, shadowOpacity: 0.55, elevation: 14 },
  dlBtnTxt:       { fontSize: 16, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },

  progHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18, paddingBottom: 12 },
  progLabel:      { flex: 1, fontSize: 14, color: C.blueLight, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  progPct:        { fontSize: 22, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  statsRow:       { flexDirection: 'row', paddingHorizontal: 18, paddingBottom: 18 },
  statItem:       { flex: 1, alignItems: 'center', gap: 4 },
  statVal:        { fontSize: 15, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  statLbl:        { fontSize: 10, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },
})