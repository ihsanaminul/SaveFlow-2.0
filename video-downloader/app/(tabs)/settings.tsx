import React, { useCallback, useEffect } from 'react'
import {
  View, Text, Switch, TouchableOpacity, StyleSheet,
  ScrollView, Alert, StatusBar,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated'
import { useSettings } from '@/hooks/useSettings'
import { historyService } from '@/services/history'
import { useStore } from '@/store/useStore'
import { C } from '@/constants/colors'
import { cleanupTempFiles } from '@/utils/fileUtils'

const QUALITIES = ['360', '480', '720', '1080'] as const

const PLAT_LIST = [
  { name: 'YouTube',   color: '#FF0000', icon: 'youtube'           },
  { name: 'TikTok',    color: '#69C9D0', icon: 'music-note-outline' },
  { name: 'Instagram', color: '#E1306C', icon: 'instagram'          },
  { name: 'Facebook',  color: '#1877F2', icon: 'facebook'           },
  { name: 'Twitter',   color: '#1DA1F2', icon: 'twitter'            },
  { name: 'Pinterest', color: '#E60023', icon: 'pinterest'          },
  { name: 'Reddit',    color: '#FF4500', icon: 'reddit'             },
  { name: 'Vimeo',     color: '#1AB7EA', icon: 'vimeo'              },
]

function FadeIn({ children, delay, style }: { children: React.ReactNode; delay: number; style?: any }) {
  const op = useSharedValue(0)
  const ty = useSharedValue(14)
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }))
    ty.value = withDelay(delay, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }))
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }))
  return <Animated.View style={[anim, style]}>{children}</Animated.View>
}

function SLabel({ text }: { text: string }) {
  return <Text style={g.secLabel}>{text.toUpperCase()}</Text>
}

function Block({ children }: { children: React.ReactNode }) {
  return <View style={g.block}>{children}</View>
}

interface RowProps {
  icon: string
  accent: string
  label: string
  sub?: string
  right?: React.ReactNode
  onPress?: () => void
  border?: boolean
  danger?: boolean
}
function Row({ icon, accent, label, sub, right, onPress, border = true, danger }: RowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[g.row, border && g.rowBorder]}
      activeOpacity={onPress ? 0.72 : 1}
      disabled={!onPress && !right}
    >
      <View style={[g.rowIcon, { backgroundColor: accent + '22' }]}>
        <Feather name={icon as any} size={15} color={accent} />
      </View>
      <View style={g.rowInfo}>
        <Text style={[g.rowLabel, danger && { color: C.error }]}>{label}</Text>
        {sub ? <Text style={g.rowSub}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={15} color={C.textMuted} /> : null)}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const insets              = useSafeAreaInsets()
  const { settings, updateSetting } = useSettings()
  const setHistory          = useStore(s => s.setHistory)

  const handleClearHistory = useCallback(() => {
    Alert.alert('Hapus Riwayat?', 'Semua riwayat download akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try { await historyService.clearAll() } catch {}
          setHistory([])
          Alert.alert('Selesai', 'Riwayat berhasil dihapus.')
        },
      },
    ])
  }, [setHistory])

  const handleClearCache = useCallback(async () => {
    try { await cleanupTempFiles() } catch {}
    Alert.alert('Selesai', 'File sementara berhasil dihapus.')
  }, [])

  return (
    <View style={g.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

        {/* Header */}
        <FadeIn delay={0} style={[g.header, { paddingTop: insets.top + 18 }]}>
          <View>
            <Text style={g.pageTitle}>Pengaturan</Text>
            <Text style={g.pageSub}>Konfigurasi preferensi aplikasi</Text>
          </View>
          <View style={g.headerBadge}>
            <MaterialCommunityIcons name="tune-variant" size={20} color={C.accent} />
          </View>
        </FadeIn>

        {/* Quality */}
        <FadeIn delay={60}>
          <View style={{ paddingHorizontal: 20 }}>
            <SLabel text="Kualitas Download" />
            <Block>
              <View style={g.qualBlock}>
                <View style={[g.rowIcon, { backgroundColor: C.accentDim }]}>
                  <Feather name="sliders" size={15} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={g.rowLabel}>Kualitas Default</Text>
                  <Text style={g.rowSub}>Dipilih: {settings?.defaultQuality ?? '720'}p</Text>
                </View>
              </View>
              <View style={g.qualRow}>
                {QUALITIES.map(q => {
                  const active = (settings?.defaultQuality ?? '720') === q
                  return (
                    <TouchableOpacity
                      key={q}
                      onPress={() => updateSetting('defaultQuality', q)}
                      style={[g.qualPill, active && g.qualPillOn]}
                      activeOpacity={0.75}
                    >
                      <Text style={[g.qualTxt, active && g.qualTxtOn]}>{q}p</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </Block>
          </View>
        </FadeIn>

        {/* Preferences */}
        <FadeIn delay={110}>
          <View style={{ paddingHorizontal: 20 }}>
            <SLabel text="Preferensi" />
            <Block>
              <Row
                icon="shield-off"
                accent={C.accent}
                label="Tanpa Watermark"
                sub="Hapus watermark platform jika tersedia"
                right={
                  <Switch
                    value={settings?.preferNoWatermark ?? true}
                    onValueChange={v => updateSetting('preferNoWatermark', v)}
                    trackColor={{ false: C.border2, true: C.accent }}
                    thumbColor={C.bg}
                    ios_backgroundColor={C.card3}
                  />
                }
              />
              <Row
                icon="image"
                accent="#1DA1F2"
                label="Auto Simpan ke Galeri"
                sub="Otomatis simpan ke kamera roll"
                border={false}
                right={
                  <Switch
                    value={settings?.autoSaveToGallery ?? true}
                    onValueChange={v => updateSetting('autoSaveToGallery', v)}
                    trackColor={{ false: C.border2, true: C.accent }}
                    thumbColor={C.bg}
                    ios_backgroundColor={C.card3}
                  />
                }
              />
            </Block>
          </View>
        </FadeIn>

        {/* Storage */}
        <FadeIn delay={160}>
          <View style={{ paddingHorizontal: 20 }}>
            <SLabel text="Penyimpanan" />
            <Block>
              <Row
                icon="trash-2"
                accent={C.error}
                label="Hapus Cache"
                sub="Hapus file download sementara"
                onPress={handleClearCache}
              />
              <Row
                icon="clock"
                accent={C.error}
                label="Hapus Semua Riwayat"
                sub="Hapus semua catatan download"
                onPress={handleClearHistory}
                border={false}
                danger
              />
            </Block>
          </View>
        </FadeIn>

        {/* Platforms */}
        <FadeIn delay={200}>
          <View style={{ paddingHorizontal: 20 }}>
            <SLabel text="Platform Didukung" />
            <View style={g.platGrid}>
              {PLAT_LIST.map(p => (
                <View key={p.name} style={g.platItem}>
                  <View style={[g.platIcon, { backgroundColor: p.color + '22' }]}>
                    <MaterialCommunityIcons name={p.icon as any} size={20} color={p.color} />
                  </View>
                  <Text style={g.platName}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeIn>

        {/* About */}
        <FadeIn delay={240}>
          <View style={{ paddingHorizontal: 20 }}>
            <SLabel text="Tentang Aplikasi" />
            <Block>
              {/* App card */}
              <View style={g.aboutCard}>
                <View style={g.aboutLogo}>
                  <MaterialCommunityIcons name="download-circle-outline" size={32} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={g.aboutName}>SaveFlow</Text>
                  <Text style={g.aboutVer}>Versi 2.0.0</Text>
                  <Text style={g.aboutDesc}>Video & foto downloader tanpa watermark</Text>
                </View>
              </View>
              <View style={g.sep} />
              <Row icon="star"        accent="#FFB800" label="Beri Rating"         onPress={() => {}} />
              <Row icon="help-circle" accent="#1DA1F2" label="Bantuan & Dukungan"  onPress={() => {}} />
              <Row icon="shield"      accent={C.accent} label="Kebijakan Privasi"  onPress={() => {}} />
              <Row icon="file-text"   accent={C.textSub} label="Syarat Layanan"   onPress={() => {}} border={false} />
            </Block>
          </View>
        </FadeIn>

        {/* Copyright footer */}
        <FadeIn delay={300}>
          <View style={g.footer}>
            <View style={g.footerDivider} />
            <Text style={g.footerCopy}>© 2025 SaveFlow</Text>
            <Text style={g.footerAuthor}>by Cleo 桜闇</Text>
            <Text style={g.footerSub}>Semua hak cipta dilindungi</Text>
          </View>
        </FadeIn>

      </ScrollView>
    </View>
  )
}

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  headerBadge: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.accentDim,
    borderWidth: 1, borderColor: C.borderHi,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  secLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 4,
  },
  block: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowInfo: { flex: 1 },
  rowLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: C.text,
  },
  rowSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  qualBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  qualRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
  },
  qualPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
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
  platGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  platItem: {
    width: '22%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
  },
  platIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  platName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9,
    color: C.textSub,
    textAlign: 'center',
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  aboutLogo: {
    width: 58, height: 58, borderRadius: 17,
    backgroundColor: C.accentDim,
    borderWidth: 1.5, borderColor: C.borderHi,
    alignItems: 'center', justifyContent: 'center',
  },
  aboutName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: C.text,
  },
  aboutVer: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  aboutDesc: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  sep: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 14,
    marginBottom: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerDivider: {
    width: 40, height: 2, borderRadius: 1,
    backgroundColor: C.card3,
    marginBottom: 12,
  },
  footerCopy: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14,
    color: C.textSub,
    letterSpacing: 0.5,
  },
  footerAuthor: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: C.accent,
    letterSpacing: 0.3,
  },
  footerSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textMuted,
  },
})
