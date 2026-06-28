import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Keyboard, KeyboardAvoidingView, Platform, StatusBar,
  Dimensions,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay, withRepeat, withSequence,
  FadeInDown, Easing,
} from 'react-native-reanimated'
import { useDownloader } from '@/hooks/useDownloader'
import { useStore } from '@/store/useStore'
import { isSupportedPlatform, getPlatformName } from '@/utils/urlValidator'
import { C } from '@/constants/colors'
import { formatFileSize, formatSpeed, formatEta } from '@/utils/fileUtils'
import { MediaInfo, QualityOption } from '@/types'

const { width: W } = Dimensions.get('window')

const PLAT: Record<string, { color: string; icon: string }> = {
  YouTube:    { color: '#FF0000', icon: 'youtube' },
  TikTok:     { color: '#69C9D0', icon: 'music-note-outline' },
  Instagram:  { color: '#E1306C', icon: 'instagram' },
  Facebook:   { color: '#1877F2', icon: 'facebook' },
  Twitter:    { color: '#1DA1F2', icon: 'twitter' },
  Pinterest:  { color: '#E60023', icon: 'pinterest' },
  Reddit:     { color: '#FF4500', icon: 'reddit' },
  Vimeo:      { color: '#1AB7EA', icon: 'vimeo' },
  Dailymotion:{ color: '#0066DC', icon: 'television-play' },
}
const pc = (n: string) => PLAT[n]?.color ?? '#888'
const pi = (n: string) => (PLAT[n]?.icon ?? 'link') as any

const PLATFORM_LIST = ['YouTube','TikTok','Instagram','Facebook','Twitter','Pinterest','Reddit','Vimeo']

// ── Shimmer ───────────────────────────────────────────────────
function Shimmer() {
  const op = useSharedValue(0.3)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3,  { duration: 650, easing: Easing.inOut(Easing.ease) }),
      ), -1,
    )
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value }))
  return (
    <Animated.View style={[s.card, anim, { gap: 12 }]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.card3 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: C.card3, width: '65%' }} />
          <View style={{ height: 8, borderRadius: 4, backgroundColor: C.card3, width: '42%' }} />
        </View>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: C.card3, width: '80%' }} />
      <View style={s.progTrack}>
        <View style={{ width: '45%', height: '100%', backgroundColor: C.card3, borderRadius: 3 }} />
      </View>
    </Animated.View>
  )
}

// ── Progress bar ──────────────────────────────────────────────
function ProgBar({ progress }: { progress: number }) {
  const w = useSharedValue(0)
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(100, progress)), { duration: 450, easing: Easing.out(Easing.cubic) })
  }, [progress])
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` as any }))
  return (
    <View style={s.progTrack}>
      <Animated.View style={[s.progFill, fill]} />
    </View>
  )
}

// ── Quality pill ──────────────────────────────────────────────
function QualPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.qualPill, active && s.qualPillOn]}
      activeOpacity={0.75}
    >
      <Text style={[s.qualTxt, active && s.qualTxtOn]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── Platform card ─────────────────────────────────────────────
function PlatCard({ name }: { name: string }) {
  const color = pc(name)
  const icon  = pi(name)
  const sc = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  return (
    <TouchableOpacity
      onPressIn={() => { sc.value = withSpring(0.88, { damping: 13, stiffness: 320 }) }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 12, stiffness: 260 }) }}
      activeOpacity={1}
      style={s.platCardWrap}
    >
      <Animated.View style={[s.platCard, anim]}>
        <View style={[s.platIcon, { backgroundColor: color + '22' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={s.platName} numberOfLines={1}>{name}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

// ── Stat mini ─────────────────────────────────────────────────
function Stat({ icon, value, label, delay }: { icon: string; value: string | number; label: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(22)} style={s.statCard}>
      <View style={s.statIconWrap}>
        <Feather name={icon as any} size={14} color={C.accent} />
      </View>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </Animated.View>
  )
}

// ── Main screen ───────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const history         = useStore(s => s.history)
  const activeDownloads = useStore(s => s.activeDownloads)
  const recent          = history.slice(0, 4)

  const [url,     setUrl]     = useState('')
  const [quality, setQuality] = useState('720')
  const [info,    setInfo]    = useState<MediaInfo | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const {
    fetchInfo, analyzeAndDownload,
    isAnalyzing, isDownloading, analyzeError,
    currentId, clearError, clearInfo,
  } = useDownloader()

  const currentDl  = currentId ? activeDownloads[currentId] : null
  const dlProgress = currentDl?.progress ?? 0
  const dlSpeed    = currentDl?.speed    ?? 0
  const dlEta      = currentDl?.eta      ?? 0
  const isActive   = isDownloading || isAnalyzing

  const isValid  = isSupportedPlatform(url)
  const platform = isValid ? getPlatformName(url) : null
  const pColor   = platform ? pc(platform) : C.accent

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
    }, 900)
    return () => clearTimeout(t)
  }, [url, isValid])

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync()
    if (text) {
      setUrl(text.trim()); setInfo(null); setSuccess(false); clearError()
    }
  }, [clearError])

  const handleClear = useCallback(() => {
    setUrl(''); setInfo(null); setSuccess(false); clearError(); clearInfo()
  }, [clearError, clearInfo])

  const handleDownload = useCallback(async () => {
    if (!url || !isValid || isActive) return
    Keyboard.dismiss()
    try {
      await analyzeAndDownload(url, quality)
      setSuccess(true); setUrl(''); setInfo(null); clearInfo()
    } catch {}
  }, [url, isValid, quality, isActive, analyzeAndDownload, clearInfo])

  const totalToday  = history.filter(h => new Date(h.downloadedAt).toDateString() === new Date().toDateString()).length
  const successRate = history.length > 0
    ? Math.round(history.filter(h => h.status === 'completed').length / history.length * 100)
    : 100

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Header ── */}
          <Animated.View
            entering={FadeInDown.duration(400).springify().damping(22)}
            style={[s.header, { paddingTop: insets.top + 18 }]}
          >
            <View>
              <Text style={s.greeting}>Hai, Selamat datang! 👋</Text>
              <Text style={s.greetSub}>Siap download video hari ini?</Text>
            </View>
            <View style={s.headerBadge}>
              <MaterialCommunityIcons name="download-circle-outline" size={18} color={C.accent} />
              <Text style={s.headerCount}>{history.length}</Text>
            </View>
          </Animated.View>

          {/* ── URL Input ── */}
          <Animated.View
            entering={FadeInDown.delay(60).springify().damping(22)}
            style={s.sectionWrap}
          >
            <Text style={s.sectionTitle}>Download</Text>
            <Text style={s.sectionSub}>Tempel link dari platform manapun</Text>

            <View style={[s.inputCard, isValid && { borderColor: pColor + '70' }]}>
              <View style={[s.inputPrefix, { backgroundColor: isValid ? pColor + '22' : C.card2 }]}>
                {isValid && platform
                  ? <MaterialCommunityIcons name={pi(platform)} size={16} color={pColor} />
                  : <Feather name="link-2" size={15} color={C.textSub} />
                }
              </View>
              <TextInput
                ref={inputRef}
                style={s.input}
                value={url}
                onChangeText={t => {
                  setUrl(t.trim()); setInfo(null); setSuccess(false); clearError()
                }}
                placeholder="Tempel link video di sini…"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                editable={!isActive}
              />
              {url.length > 0
                ? <TouchableOpacity onPress={handleClear} style={s.inputAction} disabled={isActive}>
                    <Feather name="x" size={14} color={C.textSub} />
                  </TouchableOpacity>
                : <TouchableOpacity onPress={handlePaste} style={s.pasteBtn} activeOpacity={0.82}>
                    <Feather name="clipboard" size={13} color={C.bg} />
                    <Text style={s.pasteTxt}>Tempel</Text>
                  </TouchableOpacity>
              }
            </View>

            {/* Error */}
            {analyzeError && !isActive && (
              <Animated.View entering={FadeInDown.duration(260)} style={s.errCard}>
                <Feather name="alert-circle" size={14} color={C.error} />
                <Text style={s.errTxt} numberOfLines={2}>{analyzeError}</Text>
                <TouchableOpacity
                  onPress={clearError}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={13} color={C.error} />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Shimmer */}
            {isAnalyzing && !isDownloading && (
              <View style={{ marginTop: 10 }}>
                <Shimmer />
                <Text style={s.analyzingTxt}>Menganalisis URL…</Text>
              </View>
            )}

            {/* Media info */}
            {info && !isActive && !success && (
              <Animated.View entering={FadeInDown.springify().damping(18)} style={[s.card, { marginTop: 10 }]}>
                <View style={s.infoRow}>
                  <View style={[s.platBadge, { backgroundColor: pc(info.platform) + '22' }]}>
                    <MaterialCommunityIcons name={pi(info.platform)} size={16} color={pc(info.platform)} />
                    <Text style={[s.platBadgeTxt, { color: pc(info.platform) }]}>{info.platform}</Text>
                  </View>
                  <View style={s.typeBadge}>
                    <Text style={s.typeBadgeTxt}>
                      {info.type === 'gallery' ? `Galeri (${info.urls.length})` : info.type === 'video' ? 'Video' : 'Foto'}
                    </Text>
                  </View>
                </View>
                {info.title ? <Text style={s.infoTitle} numberOfLines={2}>{info.title}</Text> : null}
                {info.thumbnail ? (
                  <Image source={{ uri: info.thumbnail }} style={s.thumb} contentFit="cover" />
                ) : null}
                <View style={s.qualRow}>
                  {availableQualities.map(q => (
                    <QualPill
                      key={q.value}
                      label={q.label}
                      active={quality === q.value}
                      onPress={() => setQuality(q.value)}
                    />
                  ))}
                </View>
                <TouchableOpacity style={s.dlBtn} onPress={handleDownload} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="download" size={20} color={C.bg} />
                  <Text style={s.dlBtnTxt}>DOWNLOAD SEKARANG</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Downloading */}
            {isDownloading && (
              <Animated.View entering={FadeInDown.duration(280)} style={[s.card, { marginTop: 10 }]}>
                <View style={s.progHeader}>
                  <View style={s.progDot} />
                  <Text style={s.progTitle} numberOfLines={1}>
                    {currentDl?.title || 'Mengunduh…'}
                  </Text>
                  <Text style={s.progPct}>{dlProgress}%</Text>
                </View>
                <ProgBar progress={dlProgress} />
                <View style={s.progMeta}>
                  <Text style={s.progMetaTxt}>{dlSpeed > 0 ? formatSpeed(dlSpeed) : '—'}</Text>
                  <Text style={s.progMetaTxt}>{dlEta > 0 ? formatEta(dlEta) : '—'}</Text>
                  <Text style={s.progMetaTxt}>
                    {currentDl?.totalBytes ? formatFileSize(currentDl.totalBytes) : '—'}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Success */}
            {success && (
              <Animated.View
                entering={FadeInDown.springify().damping(14)}
                style={[s.card, s.successCard]}
              >
                <View style={s.successIconBox}>
                  <Feather name="check" size={28} color={C.accent} />
                </View>
                <Text style={s.successTitle}>Download Selesai!</Text>
                <Text style={s.successSub}>Video tersimpan ke galeri kamu</Text>
                <TouchableOpacity onPress={() => setSuccess(false)} style={s.againBtn} activeOpacity={0.8}>
                  <Text style={s.againTxt}>Download Lagi</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Stats ── */}
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>Statistik</Text>
            <View style={s.statsRow}>
              <Stat icon="download"     value={history.length} label="Total"    delay={0}   />
              <View style={s.statDiv} />
              <Stat icon="calendar"     value={totalToday}     label="Hari Ini" delay={40}  />
              <View style={s.statDiv} />
              <Stat icon="check-circle" value={`${successRate}%`} label="Sukses" delay={80} />
            </View>
          </View>

          {/* ── Platform grid ── */}
          <Animated.View
            entering={FadeInDown.delay(120).springify().damping(22)}
            style={s.sectionWrap}
          >
            <Text style={s.sectionTitle}>Platform Didukung</Text>
            <View style={s.platGrid}>
              {PLATFORM_LIST.map(name => <PlatCard key={name} name={name} />)}
            </View>
          </Animated.View>

          {/* ── Recent ── */}
          {recent.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(160).springify().damping(22)}
              style={s.sectionWrap}
            >
              <Text style={s.sectionTitle}>Download Terbaru</Text>
              <View style={s.recentList}>
                {recent.map((item, i) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(i * 50).springify().damping(20)}
                    style={s.recentRow}
                  >
                    <View style={s.recentThumb}>
                      {item.thumbnail
                        ? <Image
                            source={{ uri: item.thumbnail }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: pc(item.platform) + '22' }]}>
                            <MaterialCommunityIcons name={pi(item.platform)} size={16} color={pc(item.platform)} />
                          </View>
                      }
                    </View>
                    <View style={s.recentInfo}>
                      <Text style={s.recentTitle} numberOfLines={1}>
                        {item.title || 'Untitled'}
                      </Text>
                      <Text style={[s.recentPlat, { color: pc(item.platform) }]}>
                        {item.platform} · {item.type === 'video' ? 'Video' : 'Foto'}
                      </Text>
                      {item.fileSize > 0 && (
                        <View style={s.recentProgWrap}>
                          <View style={[s.recentProg, { flex: 1 }]}>
                            <View style={[s.recentProgFill, { width: '100%' }]} />
                          </View>
                          <Text style={s.recentSize}>{formatFileSize(item.fileSize)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[
                      s.recentBadge,
                      { backgroundColor: item.status === 'completed' ? C.successDim : C.errorDim },
                    ]}>
                      <Feather
                        name={item.status === 'completed' ? 'check' : 'x'}
                        size={11}
                        color={item.status === 'completed' ? C.success : C.error}
                      />
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const CARD_W = (W - 40 - 30) / 4

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: C.text,
  },
  greetSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.textSub,
    marginTop: 3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.borderHi,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerCount: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: C.accent,
  },
  sectionWrap: { paddingHorizontal: 20, paddingTop: 20, gap: 6 },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 17,
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.textSub,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 10,
    overflow: 'hidden',
  },
  inputPrefix: {
    width: 46,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingVertical: 14,
    paddingRight: 8,
  },
  inputAction: { padding: 12 },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 6,
  },
  pasteTxt: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: C.bg,
  },
  errCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.errorDim,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.error + '33',
  },
  errTxt: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.error,
  },
  analyzingTxt: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: C.textSub,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  infoRow: { flexDirection: 'row', gap: 8 },
  platBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  platBadgeTxt: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
  },
  typeBadge: {
    backgroundColor: C.accentDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeTxt: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: C.accent,
  },
  infoTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  thumb: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    backgroundColor: C.card2,
  },
  qualRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  qualPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card2,
  },
  qualPillOn: { backgroundColor: C.accent, borderColor: C.accent },
  qualTxt:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: C.textSub },
  qualTxtOn: { color: C.bg, fontFamily: 'PlusJakartaSans_700Bold' },
  dlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 15,
  },
  dlBtnTxt: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14,
    color: C.bg,
    letterSpacing: 1,
  },
  progTrack: {
    height: 6,
    backgroundColor: C.card3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 3,
    minWidth: 6,
  },
  progHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.accent,
    flexShrink: 0,
  },
  progTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.text,
  },
  progPct: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16,
    color: C.accent,
  },
  progMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  progMetaTxt: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: C.textSub,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: C.accentDim,
    borderColor: C.borderHi,
  },
  successIconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(200,245,0,0.18)',
    borderWidth: 2, borderColor: C.borderHi,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: C.text,
  },
  successSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.textSub,
  },
  againBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 10, backgroundColor: C.card2,
    borderWidth: 1, borderColor: C.border,
  },
  againTxt: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.textSub,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: C.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  statVal: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20,
    color: C.text,
  },
  statLbl: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textSub,
  },
  statDiv: {
    width: 1,
    height: 36,
    backgroundColor: C.border,
  },
  platGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  platCardWrap: {
    width: CARD_W,
  },
  platCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  platIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  platName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: C.textSub,
    textAlign: 'center',
  },
  recentList: { gap: 8, marginTop: 8 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  recentThumb: {
    width: 50, height: 50, borderRadius: 10,
    overflow: 'hidden', backgroundColor: C.card2,
    flexShrink: 0,
  },
  recentInfo: { flex: 1, gap: 4 },
  recentTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.text,
  },
  recentPlat: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
  },
  recentProgWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  recentProg: {
    height: 4, borderRadius: 2,
    backgroundColor: C.card3,
    overflow: 'hidden',
  },
  recentProgFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  recentSize: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textSub,
  },
  recentBadge: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
})
