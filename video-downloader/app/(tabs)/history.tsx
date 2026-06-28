import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Alert, SectionList, StatusBar,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence,
  FadeInDown, FadeOutRight, Layout, Easing,
} from 'react-native-reanimated'
import { useStore } from '@/store/useStore'
import { historyService } from '@/services/history'
import { C } from '@/constants/colors'
import { formatFileSize, formatSpeed, formatEta } from '@/utils/fileUtils'
import { DownloadRecord } from '@/types'

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

function groupLabel(dateStr: string): string {
  const d    = new Date(dateStr)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hari Ini'
  if (diff === 1) return 'Kemarin'
  if (diff <  7)  return `${diff} Hari Lalu`
  if (diff < 30)  return `${Math.floor(diff / 7)} Minggu Lalu`
  return d.toLocaleDateString('id', { month: 'long', year: 'numeric' })
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })
}

// ── Pulse dot ─────────────────────────────────────────────────
function PulseDot() {
  const op = useSharedValue(1)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,   { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ), -1,
    )
  }, [])
  return (
    <Animated.View
      style={[h.dot, useAnimatedStyle(() => ({ opacity: op.value }))]}
    />
  )
}

// ── Active download card ───────────────────────────────────────
function ActiveCard({ item }: { item: any }) {
  const cancel = useStore(s => s.cancelDownload)
  const pct    = Math.round(item.progress ?? 0)
  const color  = pc(item.platform ?? '')

  const wv = useSharedValue(0)
  useEffect(() => {
    wv.value = withTiming(pct, { duration: 450, easing: Easing.out(Easing.cubic) })
  }, [pct])
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, wv.value))}%` as any }))

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(20)}
      exiting={FadeOutRight.duration(220)}
      layout={Layout.springify()}
      style={h.activeCard}
    >
      <View style={h.activeHead}>
        <PulseDot />
        <Text style={h.activeTitle} numberOfLines={1}>{item.title || 'Mengunduh…'}</Text>
        <View style={[h.platTag, { backgroundColor: color + '22' }]}>
          <MaterialCommunityIcons name={pi(item.platform ?? '')} size={12} color={color} />
          <Text style={[h.platTagTxt, { color }]}>{item.platform}</Text>
        </View>
      </View>
      <View style={h.progTrack}>
        <Animated.View style={[h.progFill, fill]} />
      </View>
      <View style={h.activeStats}>
        <Text style={h.activeStatTxt}>{pct}%</Text>
        <Text style={h.activeStatTxt}>{(item.speed ?? 0) > 0 ? formatSpeed(item.speed) : '—'}</Text>
        <Text style={h.activeStatTxt}>{(item.eta   ?? 0) > 0 ? formatEta(item.eta)     : '—'}</Text>
        <TouchableOpacity
          onPress={() => cancel(item.id)}
          style={h.cancelBtn}
          activeOpacity={0.8}
        >
          <Feather name="x" size={11} color={C.error} />
          <Text style={h.cancelTxt}>Batalkan</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

// ── History row ───────────────────────────────────────────────
function HistRow({ item, index, onDelete }: {
  item: DownloadRecord; index: number; onDelete: () => void
}) {
  const done  = item.status === 'completed'
  const color = pc(item.platform)

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 10) * 40).springify().damping(22)}
      exiting={FadeOutRight.duration(200)}
      layout={Layout.springify()}
      style={h.rowWrap}
    >
      <View style={h.row}>
        <View style={h.thumb}>
          {item.thumbnail
            ? <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" />
            : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: color + '22' }]}>
                <MaterialCommunityIcons name={pi(item.platform)} size={16} color={color} />
              </View>
          }
        </View>
        <View style={h.rowInfo}>
          <Text style={h.rowTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
          <Text style={[h.rowPlat, { color }]}>
            {item.platform} · {item.type === 'video' ? 'Video' : 'Foto'}
          </Text>
          <Text style={h.rowMeta}>
            {item.fileSize > 0 ? formatFileSize(item.fileSize) + ' · ' : ''}{fmtTime(item.downloadedAt)}
          </Text>
          {item.fileSize > 0 && (
            <View style={h.miniProg}>
              <View style={[h.miniProgFill, done && { width: '100%' }]} />
            </View>
          )}
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={[h.badge, { backgroundColor: done ? C.successDim : C.errorDim }]}>
            <Feather name={done ? 'check' : 'x'} size={11} color={done ? C.success : C.error} />
          </View>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={14} color={C.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
}

// ── Filter pill ───────────────────────────────────────────────
const FILTERS = ['Semua', 'Video', 'Foto', 'Gagal'] as const
type Filter = typeof FILTERS[number]

// ── Main screen ───────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState<Filter>('Semua')
  const [search, setSearch] = useState('')

  const history         = useStore(s => s.history)
  const activeDownloads = useStore(s => s.activeDownloads)
  const removeHistory   = useStore(s => s.removeHistory)
  const clearHistory    = useStore(s => s.clearHistory)

  const active = useMemo(() =>
    Object.values(activeDownloads).filter(dl =>
      ['downloading', 'pending', 'analyzing', 'saving'].includes(dl.status)
    ), [activeDownloads]
  )

  const filtered = useMemo(() => {
    let list = [...history]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) || i.platform.toLowerCase().includes(q)
      )
    }
    if (filter === 'Video') list = list.filter(i => i.type === 'video')
    if (filter === 'Foto')  list = list.filter(i => i.type !== 'video')
    if (filter === 'Gagal') list = list.filter(i => i.status === 'failed')
    return list
  }, [history, filter, search])

  const sections = useMemo(() => {
    const map = new Map<string, DownloadRecord[]>()
    filtered.forEach(item => {
      const lbl = groupLabel(item.downloadedAt)
      if (!map.has(lbl)) map.set(lbl, [])
      map.get(lbl)!.push(item)
    })
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
  }, [filtered])

  const handleDelete = useCallback((item: DownloadRecord) => {
    Alert.alert('Hapus Item', 'Hapus item ini dari riwayat?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try { await historyService.deleteRecord(item.id) } catch {}
          removeHistory(item.id)
        },
      },
    ])
  }, [removeHistory])

  const handleClearAll = useCallback(() => {
    Alert.alert('Hapus Semua?', 'Seluruh riwayat download akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try { await historyService.clearAll() } catch {}
          clearHistory()
        },
      },
    ])
  }, [clearHistory])

  return (
    <View style={h.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        stickySectionHeadersEnabled={false}

        ListHeaderComponent={
          <>
            {/* Header */}
            <Animated.View
              entering={FadeInDown.duration(360).springify().damping(22)}
              style={[h.pageHeader, { paddingTop: insets.top + 18 }]}
            >
              <View>
                <Text style={h.pageTitle}>Riwayat</Text>
                <Text style={h.pageSub}>
                  {history.length} unduhan{active.length > 0 ? ` · ${active.length} aktif` : ''}
                </Text>
              </View>
              {history.length > 0 && (
                <TouchableOpacity onPress={handleClearAll} style={h.clearBtn} activeOpacity={0.8}>
                  <Feather name="trash-2" size={15} color={C.error} />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Active downloads */}
            {active.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(40).springify().damping(22)}
                style={h.activeSection}
              >
                <Text style={h.groupLbl}>SEDANG BERJALAN</Text>
                {active.map(item => <ActiveCard key={item.id} item={item} />)}
              </Animated.View>
            )}

            {/* Search */}
            <Animated.View
              entering={FadeInDown.delay(60).springify().damping(22)}
              style={h.searchWrap}
            >
              <View style={h.searchBox}>
                <Feather name="search" size={14} color={C.textSub} />
                <TextInput
                  style={h.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Cari riwayat…"
                  placeholderTextColor={C.textMuted}
                />
                {search.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearch('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={14} color={C.textSub} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {/* Filters */}
            <Animated.View
              entering={FadeInDown.delay(80).springify().damping(22)}
              style={h.filterRow}
            >
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[h.filterPill, filter === f && h.filterPillOn]}
                  activeOpacity={0.75}
                >
                  <Text style={[h.filterTxt, filter === f && h.filterTxtOn]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </>
        }

        renderSectionHeader={({ section }) => (
          <Text style={[h.groupLbl, { marginLeft: 20, marginBottom: 8, marginTop: 8 }]}>
            {section.title.toUpperCase()}
          </Text>
        )}

        renderItem={({ item, index }) => (
          <HistRow item={item} index={index} onDelete={() => handleDelete(item)} />
        )}

        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(100).springify().damping(22)} style={h.empty}>
            <View style={h.emptyIcon}>
              <MaterialCommunityIcons name="download-off-outline" size={30} color={C.textMuted} />
            </View>
            <Text style={h.emptyTitle}>Belum ada riwayat</Text>
            <Text style={h.emptySub}>Video yang kamu unduh akan muncul di sini</Text>
          </Animated.View>
        }
      />
    </View>
  )
}

const h = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    color: C.text,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.textSub,
    marginTop: 4,
  },
  clearBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.errorDim,
    borderWidth: 1, borderColor: C.error + '40',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  activeSection: { paddingHorizontal: 20, marginBottom: 4 },
  groupLbl: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    gap: 10,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  filterPillOn: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  filterTxt: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.textSub,
  },
  filterTxtOn: {
    color: C.bg,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.accent,
    flexShrink: 0,
  },
  activeCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderHi,
    padding: 14,
    gap: 10,
    marginBottom: 10,
    marginTop: 8,
  },
  activeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.text,
  },
  platTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  platTagTxt: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
  },
  progTrack: {
    height: 5,
    backgroundColor: C.card3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 3,
    minWidth: 5,
  },
  activeStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeStatTxt: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: C.textSub,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: C.errorDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  cancelTxt: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: C.error,
  },
  rowWrap: { paddingHorizontal: 20, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  thumb: {
    width: 52, height: 52,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: C.card2,
    flexShrink: 0,
  },
  rowInfo: { flex: 1, gap: 3 },
  rowTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.text,
  },
  rowPlat: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
  },
  rowMeta: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textSub,
  },
  miniProg: {
    height: 3,
    backgroundColor: C.card3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 3,
  },
  miniProgFill: {
    height: '100%',
    width: '100%',
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  badge: {
    width: 26, height: 26, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: C.card2,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: C.textSub,
  },
  emptySub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
})
