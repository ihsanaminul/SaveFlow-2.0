import React, { memo, useState, useMemo, useCallback, useEffect } from 'react'
import {
  View, Text, Pressable, StyleSheet, TextInput,
  Alert, SectionList, Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence,
  FadeInDown, FadeOutRight,
  Layout, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Bg from '@/components/Bg'
import Card from '@/components/Card'
import { PlatformChip, getPlatformColor } from '@/components/PlatformChip'
import { ProgressBar } from '@/components/ProgressBar'
import { useStore } from '@/store/useStore'
import { historyService } from '@/services/history'
import { C } from '@/constants/colors'
import { formatFileSize, formatSpeed, formatEta } from '@/utils/fileUtils'
import { DownloadRecord } from '@/types'

function getGroupLabel(dateStr: string): string {
  const d = new Date(dateStr), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hari Ini'
  if (diff === 1) return 'Kemarin'
  if (diff < 7)  return `${diff} Hari Lalu`
  if (diff < 30) return `${Math.floor(diff / 7)} Minggu Lalu`
  return d.toLocaleDateString('id', { month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })
}

function PulseDot({ color = C.blue }: { color?: string }) {
  const op = useSharedValue(1)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 650, easing: Easing.inOut(Easing.ease) }),
      ), -1,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value }))
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, style]} />
}

// ── Context menu ──────────────────────────────────────────────
function ContextMenu({ item, onClose, onDelete }: {
  item: DownloadRecord; onClose: () => void; onDelete: () => void
}) {
  const scale = useSharedValue(0.85)
  const op    = useSharedValue(0)

  useEffect(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 300 })
    op.value    = withTiming(1, { duration: 160 })
  }, [])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: op.value }))
  const sheetStyle   = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, cm.overlay, overlayStyle]}>
        <BlurView intensity={16} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[cm.sheet, sheetStyle]}>
          <View style={cm.handle} />
          <View style={cm.meta}>
            <PlatformChip name={item.platform} size={26} />
            <Text style={cm.metaTitle} numberOfLines={2}>{item.title || item.filename}</Text>
          </View>
          <Pressable onPress={onDelete} style={cm.action}>
            <View style={[cm.actionIcon, { backgroundColor: C.errorDim }]}>
              <Feather name="trash-2" size={16} color={C.error} />
            </View>
            <Text style={[cm.actionTxt, { color: C.error }]}>Hapus</Text>
          </Pressable>
          <Pressable onPress={onClose} style={cm.action}>
            <View style={[cm.actionIcon, { backgroundColor: C.white06 }]}>
              <Feather name="x" size={16} color={C.white60} />
            </View>
            <Text style={[cm.actionTxt, { color: C.white60 }]}>Batal</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const cm = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', padding: 16 },
  sheet:      { backgroundColor: '#111428', borderRadius: 24, padding: 16, gap: 4, borderWidth: 1, borderColor: C.border },
  handle:     { width: 38, height: 4, borderRadius: 2, backgroundColor: C.white20, alignSelf: 'center', marginBottom: 14 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingHorizontal: 4 },
  metaTitle:  { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  action:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, borderRadius: 14 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionTxt:  { fontSize: 15, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },
})

// ── Active download card ──────────────────────────────────────
const ActiveCard = memo(function ActiveCard({ item }: { item: any }) {
  const cancel = useStore(s => s.cancelDownload)
  const pct    = Math.round(item.progress ?? 0)
  const pColor = getPlatformColor(item.platform ?? '')

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(160)}
      exiting={FadeOutRight.duration(200)}
      layout={Layout.springify()}
      style={{ paddingHorizontal: 18, marginBottom: 10 }}
    >
      <Card radius={18} glow glowColor={C.blueGlow} noPad>
        <View style={ac.header}>
          <PulseDot color={C.blue} />
          <Text style={ac.headTxt} numberOfLines={1}>{item.title || 'Mengunduh…'}</Text>
          <View style={[ac.platTag, { backgroundColor: pColor + '1A' }]}>
            <PlatformChip name={item.platform ?? 'YouTube'} size={13} />
            <Text style={[ac.platTxt, { color: pColor }]}>{item.platform}</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <ProgressBar progress={pct} height={5} />
        </View>
        <View style={ac.statsRow}>
          {[
            { label: 'Kecepatan', val: (item.speed ?? 0) > 0 ? formatSpeed(item.speed) : '—' },
            { label: 'Sisa',      val: (item.eta   ?? 0) > 0 ? formatEta(item.eta)     : '—' },
            { label: 'Ukuran',    val: (item.totalBytes ?? 0) > 0 ? formatFileSize(item.totalBytes) : '—' },
          ].map((st, i) => (
            <View key={i} style={[ac.stat, i < 2 && { borderRightWidth: 1, borderRightColor: C.white10 }]}>
              <Text style={ac.statVal}>{st.val}</Text>
              <Text style={ac.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <Pressable onPress={() => cancel(item.id)} style={ac.cancelBtn}>
            <Feather name="x-circle" size={13} color={C.error} />
            <Text style={ac.cancelTxt}>Batalkan</Text>
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  )
})

const ac = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, paddingBottom: 10 },
  headTxt:   { flex: 1, fontSize: 13, fontWeight: '700', color: C.blueLight, fontFamily: 'PlusJakartaSans_700Bold' },
  platTag:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  platTxt:   { fontSize: 11, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  statsRow:  { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10 },
  stat:      { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  statVal:   { fontSize: 14, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  statLbl:   { fontSize: 10, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, backgroundColor: C.errorDim, borderWidth: 1, borderColor: 'rgba(244,63,94,0.18)' },
  cancelTxt: { fontSize: 13, fontWeight: '700', color: C.error, fontFamily: 'PlusJakartaSans_700Bold' },
})

// ── History row ───────────────────────────────────────────────
const HistoryRow = memo(function HistoryRow({
  item, index, onLongPress,
}: { item: DownloadRecord; index: number; onLongPress: () => void }) {
  const done   = item.status === 'completed'
  const pColor = getPlatformColor(item.platform)
  const sc     = useSharedValue(1)

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 40).springify().damping(20).stiffness(180)}
      exiting={FadeOutRight.duration(200)}
      layout={Layout.springify()}
    >
      <Pressable
        onPressIn={() => { sc.value = withSpring(0.97, { damping: 14, stiffness: 300 }) }}
        onPressOut={() => { sc.value = withSpring(1, { damping: 12, stiffness: 260 }) }}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          onLongPress()
        }}
        delayLongPress={380}
      >
        <Animated.View style={[{ paddingHorizontal: 18, marginBottom: 8 }, useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))]}>
          <Card radius={16} noPad>
            <View style={h.row}>
              <View style={h.thumb}>
                {item.thumbnail
                  ? <Image source={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
                  : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.blueDim, alignItems: 'center', justifyContent: 'center' }]}>
                      <Feather name="film" size={14} color={C.blue} />
                    </View>
                }
                <View style={[h.dot, { backgroundColor: done ? C.success : C.error }]} />
              </View>
              <View style={h.info}>
                <Text style={h.title} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                <Text style={[h.platform, { color: pColor }]}>
                  {item.platform} · {item.type === 'video' ? 'Video' : 'Foto'}
                </Text>
                <Text style={h.meta}>
                  {formatFileSize(item.fileSize)} · {formatTime(item.downloadedAt)}
                </Text>
              </View>
              <View style={[h.badge, { backgroundColor: done ? C.successDim : C.errorDim }]}>
                <Feather name={done ? 'check' : 'x'} size={12} color={done ? C.success : C.error} />
              </View>
            </View>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
})

const h = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  thumb:    { width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, backgroundColor: C.blueDim },
  dot:      { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4 },
  info:     { flex: 1, gap: 4 },
  title:    { fontSize: 13, fontWeight: '600', color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  platform: { fontSize: 11, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  meta:     { fontSize: 10, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular' },
  badge:    { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
})

// ── Filter tabs ───────────────────────────────────────────────
const FILTERS = ['Semua', 'Video', 'Foto', 'Gagal'] as const
type Filter = typeof FILTERS[number]

// ── Main screen ───────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState<Filter>('Semua')
  const [search, setSearch] = useState('')
  const [ctx,    setCtx]    = useState<DownloadRecord | null>(null)

  const history         = useStore(s => s.history)
  const activeDownloads = useStore(s => s.activeDownloads)
  const removeHistory   = useStore(s => s.removeHistory)
  const clearHistory    = useStore(s => s.clearHistory)

  const active = useMemo(() =>
    Object.values(activeDownloads).filter(d =>
      ['downloading', 'pending', 'analyzing', 'saving'].includes(d.status)
    ), [activeDownloads])

  const filtered = useMemo(() => {
    let list = [...history]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.platform.toLowerCase().includes(q))
    }
    if (filter === 'Video') list = list.filter(i => i.type === 'video')
    if (filter === 'Foto')  list = list.filter(i => i.type !== 'video')
    if (filter === 'Gagal') list = list.filter(i => i.status === 'failed')
    return list
  }, [history, filter, search])

  const sections = useMemo(() => {
    const map = new Map<string, DownloadRecord[]>()
    filtered.forEach(item => {
      const lbl = getGroupLabel(item.downloadedAt)
      if (!map.has(lbl)) map.set(lbl, [])
      map.get(lbl)!.push(item)
    })
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
  }, [filtered])

  const handleDelete = useCallback(async (item: DownloadRecord) => {
    Alert.alert('Hapus', 'Hapus item ini dari riwayat?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await historyService.deleteRecord(item.id)
          removeHistory(item.id)
          setCtx(null)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        },
      },
    ])
  }, [removeHistory])

  const handleClearAll = useCallback(() => {
    Alert.alert('Hapus Semua', 'Hapus seluruh riwayat download?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await historyService.clearAll()
          clearHistory()
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        },
      },
    ])
  }, [clearHistory])

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Bg />

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        stickySectionHeadersEnabled={false}

        ListHeaderComponent={
          <>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(360)} style={[d.header, { paddingTop: insets.top + 20 }]}>
              <View>
                <Text style={d.title}>Downloads</Text>
                <Text style={d.sub}>{history.length} total · {active.length} aktif</Text>
              </View>
              {history.length > 0 && (
                <Pressable onPress={handleClearAll} style={d.trashBtn}>
                  <Feather name="trash-2" size={16} color={C.error} />
                </Pressable>
              )}
            </Animated.View>

            {/* Active downloads */}
            {active.length > 0 && (
              <Animated.View entering={FadeInDown.delay(50).springify()}>
                <Text style={d.groupHdr}>AKTIF</Text>
                {active.map(item => <ActiveCard key={item.id} item={item} />)}
              </Animated.View>
            )}

            {/* Search */}
            <Animated.View entering={FadeInDown.delay(70).springify()} style={d.searchWrap}>
              <View style={d.searchBox}>
                <Feather name="search" size={14} color={C.white40} />
                <TextInput
                  style={d.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Cari riwayat…"
                  placeholderTextColor={C.white20}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <Feather name="x" size={14} color={C.white40} />
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* Filter pills */}
            <Animated.View entering={FadeInDown.delay(90).springify()} style={d.filterWrap}>
              {FILTERS.map(f => {
                const on = filter === f
                const sc = useSharedValue(1)
                return (
                  <Pressable
                    key={f}
                    onPress={() => { setFilter(f); Haptics.selectionAsync() }}
                    onPressIn={() => { sc.value = withSpring(0.92, { damping: 13, stiffness: 300 }) }}
                    onPressOut={() => { sc.value = withSpring(1, { damping: 11, stiffness: 240 }) }}
                  >
                    <Animated.View style={[d.filterPill, on && d.filterPillOn, useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))]}>
                      {on && <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 50 }]} />}
                      <Text style={[d.filterTxt, on && d.filterTxtOn]}>{f}</Text>
                    </Animated.View>
                  </Pressable>
                )
              })}
            </Animated.View>
          </>
        }

        renderSectionHeader={({ section }) => (
          <Text style={d.groupHdr}>{section.title.toUpperCase()}</Text>
        )}

        renderItem={({ item, index }) => (
          <HistoryRow item={item} index={index} onLongPress={() => setCtx(item)} />
        )}

        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(110).springify()} style={d.empty}>
            <View style={d.emptyIcon}>
              <LinearGradient colors={[C.blue, C.teal]} style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
              <Feather name="inbox" size={28} color="#fff" />
            </View>
            <Text style={d.emptyTitle}>Belum ada download</Text>
            <Text style={d.emptySub}>Video yang kamu unduh akan muncul disini</Text>
          </Animated.View>
        }
      />

      {ctx && (
        <ContextMenu
          item={ctx}
          onClose={() => setCtx(null)}
          onDelete={() => handleDelete(ctx)}
        />
      )}
    </View>
  )
}

const d = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, paddingBottom: 20 },
  title:       { fontSize: 28, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.6 },
  sub:         { fontSize: 12, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 3 },
  trashBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: C.errorDim, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  searchWrap:  { paddingHorizontal: 18, marginBottom: 12 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, gap: 10, height: 46 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', fontFamily: 'PlusJakartaSans_400Regular' },
  filterWrap:  { flexDirection: 'row', paddingHorizontal: 18, gap: 8, marginBottom: 16 },
  filterPill:  { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, overflow: 'hidden' },
  filterPillOn:{ borderColor: 'transparent' },
  filterTxt:   { fontSize: 13, fontWeight: '600', color: C.white40, fontFamily: 'PlusJakartaSans_600SemiBold' },
  filterTxtOn: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  groupHdr:    { fontSize: 10, fontWeight: '700', color: C.white40, fontFamily: 'PlusJakartaSans_700Bold', marginLeft: 18, marginBottom: 8, marginTop: 4, letterSpacing: 1 },
  empty:       { alignItems: 'center', paddingTop: 64, gap: 14 },
  emptyIcon:   { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  emptyTitle:  { fontSize: 17, fontWeight: '800', color: C.white60, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  emptySub:    { fontSize: 13, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', paddingHorizontal: 32 },
})
