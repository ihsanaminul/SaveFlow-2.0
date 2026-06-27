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

function ActiveDot() {
  const op = useSharedValue(1)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,   { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ), -1,
    )
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value }))
  return <Animated.View style={[d.activeDot, anim]} />
}

function ActiveCard({ item }: { item: any }) {
  const cancel   = useStore(s => s.cancelDownload)
  const pct      = Math.round(item.progress ?? 0)
  const color    = platColor(item.platform ?? '')

  const w = useSharedValue(0)
  useEffect(() => {
    w.value = withTiming(pct, { duration: 450 })
  }, [pct])
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, w.value))}%` as any,
  }))

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutRight.duration(200)}
      layout={Layout.springify()}
      style={d.activeCard}
    >
      <View style={d.activeHeader}>
        <ActiveDot />
        <Text style={d.activeTitle} numberOfLines={1}>{item.title || 'Mengunduh…'}</Text>
        <View style={[d.activePlat, { backgroundColor: color + '22' }]}>
          <MaterialCommunityIcons name={platIcon(item.platform ?? '')} size={12} color={color} />
          <Text style={[d.activePlatTxt, { color }]}>{item.platform}</Text>
        </View>
      </View>
      <View style={d.progTrack}>
        <Animated.View style={[d.progFill, fillStyle]} />
      </View>
      <View style={d.activeStats}>
        <Text style={d.activeStat}>{pct}%</Text>
        <Text style={d.activeStat}>
          {(item.speed ?? 0) > 0 ? formatSpeed(item.speed) : '—'}
        </Text>
        <Text style={d.activeStat}>
          {(item.eta ?? 0) > 0 ? formatEta(item.eta) : '—'}
        </Text>
        <TouchableOpacity
          onPress={() => cancel(item.id)}
          style={d.cancelBtn}
          activeOpacity={0.8}
        >
          <Feather name="x" size={12} color={C.error} />
          <Text style={d.cancelTxt}>Batalkan</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

function HistoryRow({ item, index, onDelete }: {
  item: DownloadRecord; index: number; onDelete: () => void
}) {
  const done  = item.status === 'completed'
  const color = platColor(item.platform)
  const icon  = platIcon(item.platform)

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 40).springify().damping(20)}
      exiting={FadeOutRight.duration(200)}
      layout={Layout.springify()}
      style={d.rowWrap}
    >
      <View style={d.row}>
        <View style={d.thumb}>
          {item.thumbnail
            ? <Image source={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
            : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: color + '22' }]}>
                <MaterialCommunityIcons name={icon} size={16} color={color} />
              </View>
          }
        </View>
        <View style={d.rowInfo}>
          <Text style={d.rowTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
          <Text style={[d.rowPlat, { color }]}>
            {item.platform} · {item.type === 'video' ? 'Video' : 'Foto'}
          </Text>
          <Text style={d.rowMeta}>
            {item.fileSize > 0 ? formatFileSize(item.fileSize) + ' · ' : ''}{formatTime(item.downloadedAt)}
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={[d.statusBadge, { backgroundColor: done ? C.successDim : C.errorDim }]}>
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

const FILTERS = ['Semua', 'Video', 'Foto', 'Gagal'] as const
type Filter = typeof FILTERS[number]

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
        },
      },
    ])
  }, [removeHistory])

  const handleClearAll = useCallback(() => {
    Alert.alert('Hapus Semua?', 'Semua riwayat download akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await historyService.clearAll()
          clearHistory()
        },
      },
    ])
  }, [clearHistory])

  return (
    <View style={d.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            <Animated.View entering={FadeInDown.duration(350)} style={[d.header, { paddingTop: insets.top + 16 }]}>
              <View>
                <Text style={d.headerTitle}>Riwayat</Text>
                <Text style={d.headerSub}>
                  {history.length} unduhan · {active.length} aktif
                </Text>
              </View>
              {history.length > 0 && (
                <TouchableOpacity onPress={handleClearAll} style={d.clearBtn} activeOpacity={0.8}>
                  <Feather name="trash-2" size={15} color={C.error} />
                </TouchableOpacity>
              )}
            </Animated.View>

            {active.length > 0 && (
              <Animated.View entering={FadeInDown.delay(50).springify()} style={{ paddingHorizontal: 20 }}>
                <Text style={d.groupLbl}>SEDANG BERJALAN</Text>
                {active.map(item => <ActiveCard key={item.id} item={item} />)}
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(60).springify()} style={d.searchWrap}>
              <View style={d.searchBox}>
                <Feather name="search" size={14} color={C.textSub} />
                <TextInput
                  style={d.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Cari riwayat…"
                  placeholderTextColor={C.textMuted}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={14} color={C.textSub} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).springify()} style={d.filterRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[d.filterPill, filter === f && d.filterPillOn]}
                  activeOpacity={0.75}
                >
                  <Text style={[d.filterTxt, filter === f && d.filterTxtOn]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </>
        }
        renderSectionHeader={({ section }) => (
          <Text style={d.groupLbl}>{section.title.toUpperCase()}</Text>
        )}
        renderItem={({ item, index }) => (
          <HistoryRow
            item={item}
            index={index}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(100).springify()} style={d.empty}>
            <View style={d.emptyIcon}>
              <MaterialCommunityIcons name="download-off-outline" size={32} color={C.textMuted} />
            </View>
            <Text style={d.emptyTitle}>Belum ada riwayat</Text>
            <Text style={d.emptySub}>Video yang kamu unduh akan muncul di sini</Text>
          </Animated.View>
        }
      />
    </View>
  )
}

const d = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    color: C.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: C.textSub,
    marginTop: 3,
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.errorDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.error + '33',
    marginTop: 4,
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
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
    marginBottom: 14,
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
  groupLbl: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 1.2,
    marginLeft: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  activeCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderHi,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
    flexShrink: 0,
  },
  activeTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.text,
  },
  activePlat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activePlatTxt: {
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
  activeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeStat: {
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
  rowWrap: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
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
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: C.card2,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
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
  statusBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 72,
    gap: 14,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.card2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
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
