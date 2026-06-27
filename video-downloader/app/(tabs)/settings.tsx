import React, { useCallback, useEffect } from 'react'
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert, StatusBar } from 'react-native'
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

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const op = useSharedValue(0)
  const ty = useSharedValue(16)
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }))
    ty.value = withDelay(delay, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }))
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }))
  return <Animated.View style={anim}>{children}</Animated.View>
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={g.sectionLbl}>{label.toUpperCase()}</Text>
}

interface RowProps {
  icon: string
  iconColor: string
  label: string
  sub?: string
  right?: React.ReactNode
  onPress?: () => void
  isLast?: boolean
  destructive?: boolean
}

function SettingRow({ icon, iconColor, label, sub, right, onPress, isLast, destructive }: RowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[g.row, !isLast && g.rowBorder]}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !right}
    >
      <View style={[g.rowIcon, { backgroundColor: iconColor + '22' }]}>
        <Feather name={icon as any} size={16} color={iconColor} />
      </View>
      <View style={g.rowText}>
        <Text style={[g.rowLabel, destructive && { color: C.error }]}>{label}</Text>
        {sub ? <Text style={g.rowSub}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={16} color={C.textMuted} /> : null)}
    </TouchableOpacity>
  )
}

function QualPill({ value, active, onPress }: { value: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[g.qualPill, active && g.qualPillOn]}
      activeOpacity={0.75}
    >
      <Text style={[g.qualTxt, active && g.qualTxtOn]}>{value}p</Text>
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { settings, updateSetting } = useSettings()
  const setHistory = useStore(s => s.setHistory)

  const handleClearHistory = useCallback(() => {
    Alert.alert('Hapus Riwayat?', 'Semua riwayat download akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await historyService.clearAll()
          setHistory([])
          Alert.alert('Selesai', 'Riwayat berhasil dihapus.')
        },
      },
    ])
  }, [setHistory])

  const handleClearCache = useCallback(async () => {
    await cleanupTempFiles()
    Alert.alert('Selesai', 'File sementara berhasil dihapus.')
  }, [])

  return (
    <View style={g.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        <Fade delay={0}>
          <View style={[g.header, { paddingTop: insets.top + 16 }]}>
            <Text style={g.headerTitle}>Pengaturan</Text>
            <Text style={g.headerSub}>Konfigurasi preferensi aplikasi</Text>
          </View>
        </Fade>

        {/* Kualitas */}
        <Fade delay={60}>
          <SectionLabel label="Kualitas Download" />
          <View style={g.cardBlock}>
            <View style={g.qualHeader}>
              <View style={[g.qualHeaderIcon, { backgroundColor: C.accentDim }]}>
                <Feather name="sliders" size={16} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={g.qualLabel}>Kualitas Default</Text>
                <Text style={g.qualSub}>Dipilih: {settings?.defaultQuality ?? '720'}p</Text>
              </View>
            </View>
            <View style={g.qualRow}>
              {QUALITIES.map(q => (
                <QualPill
                  key={q}
                  value={q}
                  active={(settings?.defaultQuality ?? '720') === q}
                  onPress={() => updateSetting('defaultQuality', q)}
                />
              ))}
            </View>
          </View>
        </Fade>

        {/* Preferensi */}
        <Fade delay={110}>
          <SectionLabel label="Preferensi" />
          <View style={g.cardBlock}>
            <SettingRow
              icon="shield-off"
              iconColor={C.accent}
              label="Tanpa Watermark"
              sub="Hapus watermark platform jika tersedia"
              right={
                <Switch
                  value={settings?.preferNoWatermark ?? true}
                  onValueChange={v => updateSetting('preferNoWatermark', v)}
                  trackColor={{ false: C.border2, true: C.accent }}
                  thumbColor={C.bg}
                />
              }
            />
            <SettingRow
              icon="image"
              iconColor="#1DA1F2"
              label="Auto Simpan ke Galeri"
              sub="Otomatis simpan ke kamera roll"
              isLast
              right={
                <Switch
                  value={settings?.autoSaveToGallery ?? true}
                  onValueChange={v => updateSetting('autoSaveToGallery', v)}
                  trackColor={{ false: C.border2, true: C.accent }}
                  thumbColor={C.bg}
                />
              }
            />
          </View>
        </Fade>

        {/* Penyimpanan */}
        <Fade delay={160}>
          <SectionLabel label="Penyimpanan" />
          <View style={g.cardBlock}>
            <SettingRow
              icon="trash-2"
              iconColor={C.error}
              label="Hapus Cache"
              sub="Hapus file download sementara"
              onPress={handleClearCache}
            />
            <SettingRow
              icon="clock"
              iconColor={C.error}
              label="Hapus Riwayat"
              sub="Hapus semua catatan download"
              onPress={handleClearHistory}
              isLast
              destructive
            />
          </View>
        </Fade>

        {/* Platform didukung */}
        <Fade delay={200}>
          <SectionLabel label="Platform Didukung" />
          <View style={g.platformGrid}>
            {[
              { name: 'YouTube',   color: '#FF0000', icon: 'youtube' },
              { name: 'TikTok',    color: '#69C9D0', icon: 'music-note-outline' },
              { name: 'Instagram', color: '#E1306C', icon: 'instagram' },
              { name: 'Facebook',  color: '#1877F2', icon: 'facebook' },
              { name: 'Twitter',   color: '#1DA1F2', icon: 'twitter' },
              { name: 'Pinterest', color: '#E60023', icon: 'pinterest' },
              { name: 'Reddit',    color: '#FF4500', icon: 'reddit' },
              { name: 'Vimeo',     color: '#1AB7EA', icon: 'vimeo' },
            ].map(p => (
              <View key={p.name} style={g.platItem}>
                <View style={[g.platIcon, { backgroundColor: p.color + '22' }]}>
                  <MaterialCommunityIcons name={p.icon as any} size={20} color={p.color} />
                </View>
                <Text style={g.platName}>{p.name}</Text>
              </View>
            ))}
          </View>
        </Fade>

        {/* Tentang */}
        <Fade delay={240}>
          <SectionLabel label="Tentang" />
          <View style={g.cardBlock}>
            <View style={g.aboutRow}>
              <View style={g.aboutLogo}>
                <MaterialCommunityIcons name="download-circle-outline" size={30} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={g.aboutName}>SaveFlow</Text>
                <Text style={g.aboutVersion}>Versi 2.0.0</Text>
                <Text style={g.aboutDesc}>Downloader video & foto tanpa watermark</Text>
              </View>
            </View>
            <View style={g.sep} />
            <SettingRow icon="star"        iconColor="#FFB800" label="Beri Rating"       onPress={() => {}} />
            <SettingRow icon="help-circle" iconColor="#1DA1F2" label="Bantuan & Dukungan" onPress={() => {}} />
            <SettingRow icon="shield"      iconColor={C.accent} label="Kebijakan Privasi" onPress={() => {}} />
            <SettingRow icon="file-text"   iconColor={C.textSub} label="Syarat Layanan" onPress={() => {}} isLast />
          </View>
        </Fade>

        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={g.footer}>© 2025 SaveFlow · Hak cipta dilindungi</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const g = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginTop: 4,
  },
  sectionLbl: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 1.5,
    marginLeft: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  cardBlock: {
    marginHorizontal: 20,
    marginBottom: 22,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
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
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: C.text,
  },
  rowSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  qualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  qualHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: C.text,
  },
  qualSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
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
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
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
    paddingVertical: 12,
  },
  platIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9,
    color: C.textSub,
    textAlign: 'center',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  aboutLogo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.accentDim,
    borderWidth: 1.5,
    borderColor: C.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: C.text,
  },
  aboutVersion: {
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
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.3,
  },
})
