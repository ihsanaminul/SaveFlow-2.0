import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Keyboard, KeyboardAvoidingView, Platform, StatusBar,
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

const PLATFORM_LIST = [
  'YouTube', 'TikTok', 'Instagram', 'Facebook',
  'Twitter', 'Pinterest', 'Reddit', 'Vimeo',
]
const PLAT_CFG: Record<string, { color: string; icon: string }> = {
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
const platColor = (n: string) => PLAT_CFG[n]?.color ?? '#888'
const platIcon  = (n: string) => (PLAT_CFG[n]?.icon ?? 'link') as any

function Fade({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const op = useSharedValue(0)
  const ty = useSharedValue(18)
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }))
    ty.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 200 }))
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }))
  return <Animated.View style={[anim, style]}>{children}</Animated.View>
}

function ProgBar({ progress }: { progress: number }) {
  const w = useSharedValue(0)
  useEffect(() => {
    w.value = withTiming(progress, { duration: 450, easing: Easing.out(Easing.cubic) })
  }, [progress])
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, w.value))}%` as any,
  }))
  return (
    <View style={s.progTrack}>
      <Animated.View style={[s.progFill, fillStyle]} />
    </View>
  )
}

function Shimmer() {
  const op = useSharedValue(0.3)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ), -1,
    )
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value }))
  return (
    <Animated.View style={[s.card, anim]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.card3 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: C.card3, width: '65%' }} />
          <View style={{ height: 8, borderRadius: 4, backgroundColor: C.card3, width: '42%' }} />
        </View>
      </View>
    </Animated.View>
  )
}

function QualPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.qualPill, active && s.qualPillOn]}
      activeOpacity={0.7}
    >
      <Text style={[s.qualTxt, active && s.qualTxtOn]}>{label}</Text>
    </TouchableOpacity>
  )
}

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={s.statCard}>
      <Feather name={icon as any} size={18} color={C.accent} />
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  )
}

function PlatCard({ name, onPress }: { name: string; onPress: () => void }) {
  const color = platColor(name)
  const icon  = platIcon(name)
  return (
    <TouchableOpacity style={s.platCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.platIcon, { backgroundColor: color + '22' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={s.platName} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()

  const history         = useStore(st => st.history)
  const activeDownloads = useStore(st => st.activeDownloads)
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
  const pColor   = platform ? platColor(platform) : C.accent

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

  const totalToday = history.filter(h =>
    new Date(h.downloadedAt).toDateString() === new Date().toDateString()
  ).length
  const successRate = history.length > 0
    ? Math.round(history.filter(h => h.status === 'completed').length / history.length * 100)
    : 100

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Fade delay={0} style={[s.header, { paddingTop: insets.top + 16 }]}>
            <View>
              <Text style={s.greeting}>Hai 👋</Text>
              <Text style={s.greetSub}>Siap download video hari ini?</Text>
            </View>
            <View style={s.headerBadge}>
              <MaterialCommunityIcons name="download-circle-outline" size={22} color={C.accent} />
              <Text style={s.headerBadgeTxt}>{history.length}</Text>
            </View>
          </Fade>

          {/* Hero text */}
          <Fade delay={60} style={s.heroSection}>
            <Text style={s.heroLine1}>DOWNLOAD</Text>
            <Text style={s.heroLine2}>TANPA BATAS.</Text>
            <Text style={s.heroSub}>Video & foto dari 8+ platform, tanpa watermark.</Text>
          </Fade>

          {/* Stats row */}
          <Fade delay={100} style={s.statsRow}>
            <StatCard icon="download"     value={history.length} label="Total"    />
            <View style={s.statDivider} />
            <StatCard icon="calendar"     value={totalToday}     label="Hari Ini" />
            <View style={s.statDivider} />
            <StatCard icon="check-circle" value={`${successRate}%`} label="Sukses" />
          </Fade>

          {/* Download card */}
          <Fade delay={140} style={s.section}>
            <Text style={s.sectionTitle}>Download</Text>
            <Text style={s.sectionSub}>Tempel link dari platform manapun</Text>

            <View style={[s.inputCard, isValid && { borderColor: pColor + '66' }]}>
              <View style={[s.inputPrefix, { backgroundColor: isValid ? pColor + '22' : C.card3 }]}>
                {isValid && platform
                  ? <MaterialCommunityIcons name={platIcon(platform)} size={16} color={pColor} />
                  : <Feather name="link-2" size={16} color={C.textSub} />
                }
              </View>
              <TextInput
                ref={inputRef}
                style={s.input}
                value={url}
                onChangeText={t => { setUrl(t.trim()); setInfo(null); setSuccess(false); clearError() }}
                placeholder="Tempel link video disini…"
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
                : <TouchableOpacity onPress={handlePaste} style={s.pasteBtn} activeOpacity={0.8}>
                    <Feather name="clipboard" size={13} color={C.bg} />
                    <Text style={s.pasteTxt}>Tempel</Text>
                  </TouchableOpacity>
              }
            </View>

            {/* Error */}
            {analyzeError && !isActive && (
              <Animated.View entering={FadeInDown.duration(280)} style={s.errorCard}>
                <Feather name="alert-circle" size={14} color={C.error} />
                <Text style={s.errorTxt} numberOfLines={2}>{analyzeError}</Text>
                <TouchableOpacity onPress={clearError} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={13} color={C.error} />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Analyzing shimmer */}
            {isAnalyzing && !isDownloading && (
              <View style={{ marginTop: 10 }}>
                <Shimmer />
                <Text style={s.analyzingTxt}>Sedang menganalisis…</Text>
              </View>
            )}

            {/* Media info card */}
            {info && !isActive && !success && (
              <Animated.View entering={FadeInDown.springify().damping(16)} style={[s.card, { marginTop: 10 }]}>
                <View style={s.infoRow}>
                  <View style={[s.platBadge, { backgroundColor: platColor(info.platform) + '22' }]}>
                    <MaterialCommunityIcons name={platIcon(info.platform)} size={18} color={platColor(info.platform)} />
                    <Text style={[s.platBadgeTxt, { color: platColor(info.platform) }]}>{info.platform}</Text>
                  </View>
                  <View style={[s.typeBadge, { backgroundColor: C.accentDim }]}>
                    <Text style={s.typeBadgeTxt}>
                      {info.type === 'gallery' ? `Galeri (${info.urls.length})` : info.type === 'video' ? 'Video' : 'Foto'}
                    </Text>
                  </View>
                </View>
                {info.title ? (
                  <Text style={s.infoTitle} numberOfLines={2}>{info.title}</Text>
                ) : null}
                {info.thumbnail ? (
                  <Image source={info.thumbnail} style={s.thumb} contentFit="cover" />
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

            {/* Downloading progress */}
            {isDownloading && (
              <Animated.View entering={FadeInDown.duration(280)} style={[s.card, { marginTop: 10 }]}>
                <View style={s.progHeader}>
                  <MaterialCommunityIcons name="download-circle-outline" size={20} color={C.accent} />
                  <Text style={s.progTitle} numberOfLines={1}>
                    {currentDl?.title || 'Mengunduh…'}
                  </Text>
                  <Text style={s.progPct}>{dlProgress}%</Text>
                </View>
                <ProgBar progress={dlProgress} />
                <View style={s.progStats}>
                  <Text style={s.progStat}>
                    {dlSpeed > 0 ? formatSpeed(dlSpeed) : '—'}
                  </Text>
                  <Text style={s.progStat}>
                    {dlEta > 0 ? formatEta(dlEta) : '—'}
                  </Text>
                  <Text style={s.progStat}>
                    {currentDl?.totalBytes ? formatFileSize(currentDl.totalBytes) : '—'}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Success */}
            {success && (
              <Animated.View entering={FadeInDown.springify().damping(14)} style={[s.card, s.successCard]}>
                <View style={s.successIconWrap}>
                  <Feather name="check" size={28} color={C.accent} />
                </View>
                <Text style={s.successTitle}>Download Selesai!</Text>
                <Text style={s.successSub}>Tersimpan ke galeri kamu</Text>
                <TouchableOpacity onPress={() => setSuccess(false)} style={s.againBtn} activeOpacity={0.8}>
                  <Text style={s.againTxt}>Download Lagi</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Fade>

          {/* Platform grid */}
          <Fade delay={200} style={s.section}>
            <Text style={s.sectionTitle}>Platform Didukung</Text>
            <View style={s.platGrid}>
              {PLATFORM_LIST.map(name => (
                <PlatCard
                  key={name}
                  name={name}
                  onPress={async () => {
                    const text = await Clipboard.getStringAsync()
                    if (text && isSupportedPlatform(text)) {
                      setUrl(text.trim()); clearError(); setInfo(null)
                    }
                  }}
                />
              ))}
            </View>
          </Fade>

          {/* Recent downloads */}
          {recent.length > 0 && (
            <Fade delay={240} style={s.section}>
              <Text style={s.sectionTitle}>Download Terbaru</Text>
              <View style={s.recentList}>
                {recent.map((item, i) => (
                  <Animated.View key={item.id} entering={FadeInDown.delay(i * 40).springify().damping(18)}>
                    <View style={s.recentItem}>
                      <View style={s.recentThumb}>
                        {item.thumbnail
                          ? <Image source={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
                          : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: platColor(item.platform) + '22' }]}>
                              <MaterialCommunityIcons name={platIcon(item.platform)} size={16} color={platColor(item.platform)} />
                            </View>
                        }
                      </View>
                      <View style={s.recentInfo}>
                        <Text style={s.recentTitle} numberOfLines={1}>
                          {item.title || 'Untitled'}
                        </Text>
                        <Text style={[s.recentPlat, { color: platColor(item.platform) }]}>
                          {item.platform} · {item.type === 'video' ? 'Video' : 'Foto'}
                        </Text>
                        {item.fileSize > 0 && (
                          <Text style={s.recentSize}>{formatFileSize(item.fileSize)}</Text>
                        )}
                      </View>
                      <View style={[s.recentBadge, { backgroundColor: item.status === 'completed' ? C.successDim : C.errorDim }]}>
                        <Feather
                          name={item.status === 'completed' ? 'check' : 'x'}
                          size={11}
                          color={item.status === 'completed' ? C.success : C.error}
                        />
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Fade>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    color: C.text,
  },
  greetSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.textSub,
    marginTop: 2,
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
  headerBadgeTxt: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: C.accent,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
  },
  heroLine1: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 38,
    color: C.text,
    letterSpacing: -1,
    lineHeight: 42,
  },
  heroLine2: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 38,
    color: C.accent,
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: C.textSub,
    marginTop: 6,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: C.border,
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
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 6,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.textSub,
    marginBottom: 8,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingRight: 6,
    marginTop: 10,
    gap: 8,
  },
  inputPrefix: {
    width: 44,
    height: 48,
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
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
  },
  inputAction: {
    padding: 10,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pasteTxt: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: C.bg,
  },
  errorCard: {
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
  errorTxt: {
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
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
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
    height: 140,
    borderRadius: 10,
    backgroundColor: C.card3,
  },
  qualRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  qualPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card2,
  },
  qualPillOn: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  qualTxt: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.textSub,
  },
  qualTxtOn: {
    color: C.bg,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
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
  progHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  progStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progStat: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: C.textSub,
  },
  successCard: {
    alignItems: 'center',
    borderColor: C.borderHi,
    backgroundColor: C.accentDim,
  },
  successIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.accentDim,
    borderWidth: 2,
    borderColor: C.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.card2,
    borderWidth: 1,
    borderColor: C.border,
  },
  againTxt: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.textSub,
  },
  platGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  platCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  platIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9,
    color: C.textSub,
    textAlign: 'center',
  },
  recentList: {
    gap: 8,
    marginTop: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
  },
  recentThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.card2,
    flexShrink: 0,
  },
  recentInfo: {
    flex: 1,
    gap: 3,
  },
  recentTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.text,
  },
  recentPlat: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
  },
  recentSize: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textSub,
  },
  recentBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
