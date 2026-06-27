import React, { useCallback, useEffect } from 'react'
import { View, Text, Switch, Pressable, StyleSheet, ScrollView, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withDelay, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Bg from '@/components/Bg'
import Card from '@/components/Card'
import { useSettings } from '@/hooks/useSettings'
import { historyService } from '@/services/history'
import { useStore } from '@/store/useStore'
import { C } from '@/constants/colors'
import { cleanupTempFiles } from '@/utils/fileUtils'

const QUALITIES = ['360', '480', '720', '1080'] as const

function Fade({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const op = useSharedValue(0)
  const ty = useSharedValue(14)
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }))
    ty.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 200 }))
  }, [])
  const anim = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }))
  return <Animated.View style={[anim, style]}>{children}</Animated.View>
}

function SectionLbl({ label }: { label: string }) {
  return <Text style={sl.lbl}>{label.toUpperCase()}</Text>
}
const sl = StyleSheet.create({
  lbl: { fontSize: 10, fontWeight: '700', color: C.white40, letterSpacing: 1.2, marginLeft: 18, marginBottom: 10, marginTop: 2, fontFamily: 'PlusJakartaSans_700Bold' },
})

interface RowProps {
  icon: string; iconColor: string; iconBg?: string
  label: string; sub?: string
  right?: React.ReactNode
  onPress?: () => void
  isLast?: boolean
  showChevron?: boolean
}

function SettingRow({ icon, iconColor, iconBg, label, sub, right, onPress, isLast, showChevron = true }: RowProps) {
  const sc = useSharedValue(1)
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { if (onPress) sc.value = withSpring(0.97, { damping: 14, stiffness: 300 }) }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 12, stiffness: 260 }) }}
      style={[r.row, !isLast && r.rowBorder]}
    >
      <Animated.View style={[r.inner, useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))]}>
        <View style={[r.iconBox, { backgroundColor: iconBg ?? iconColor + '1F' }]}>
          <Feather name={icon as any} size={16} color={iconColor} />
        </View>
        <View style={r.text}>
          <Text style={r.label}>{label}</Text>
          {sub && <Text style={r.sub}>{sub}</Text>}
        </View>
        {right ?? (onPress && showChevron && (
          <Feather name="chevron-right" size={15} color={C.white20} />
        ))}
      </Animated.View>
    </Pressable>
  )
}

const r = StyleSheet.create({
  row:       { overflow: 'hidden' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSub },
  inner:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 16 },
  iconBox:   { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  text:      { flex: 1 },
  label:     { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  sub:       { fontSize: 11, color: C.white40, marginTop: 2, fontFamily: 'PlusJakartaSans_400Regular' },
})

function QualityPill({ value, active, onPress }: { value: string; active: boolean; onPress: () => void }) {
  const sc = useSharedValue(1)
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress() }}
      onPressIn={() => { sc.value = withSpring(0.92, { damping: 12, stiffness: 300 }) }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 10, stiffness: 260 }) }}
      style={[g.qualPill, active && g.qualPillActive]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))]}>
        {active && (
          <LinearGradient
            colors={[C.blue, C.teal]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 50 }]}
          />
        )}
      </Animated.View>
      <Text style={[g.qualPillTxt, active && g.qualPillTxtActive]}>{value}p</Text>
    </Pressable>
  )
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { settings, updateSetting } = useSettings()
  const setHistory = useStore(s => s.setHistory)

  const handleClearHistory = useCallback(() => {
    Alert.alert('Hapus Riwayat?', 'Semua riwayat download akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
          await historyService.clearAll(); setHistory([])
          Alert.alert('Selesai', 'Riwayat berhasil dihapus.')
        }},
    ])
  }, [setHistory])

  const handleClearCache = useCallback(async () => {
    await cleanupTempFiles()
    Alert.alert('Selesai', 'File sementara berhasil dihapus.')
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Bg />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <Fade delay={0}>
          <View style={[g.header, { paddingTop: insets.top + 20 }]}>
            <Text style={g.title}>Pengaturan</Text>
            <Text style={g.sub}>Konfigurasi preferensi kamu</Text>
          </View>
        </Fade>

        {/* Quality */}
        <Fade delay={60}>
          <SectionLbl label="Kualitas Download" />
          <View style={{ paddingHorizontal: 18, marginBottom: 22 }}>
            <Card radius={18} noPad>
              <View style={g.qualHeader}>
                <View style={[g.qualIcon, { backgroundColor: C.blueDim }]}>
                  <Feather name="sliders" size={16} color={C.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={g.qualLabel}>Kualitas Default</Text>
                  <Text style={g.qualSub}>Dipilih: {settings?.defaultQuality ?? '720'}p</Text>
                </View>
              </View>
              <View style={g.qualRow}>
                {QUALITIES.map(q => (
                  <QualityPill
                    key={q}
                    value={q}
                    active={(settings?.defaultQuality ?? '720') === q}
                    onPress={() => updateSetting('defaultQuality', q)}
                  />
                ))}
              </View>
            </Card>
          </View>
        </Fade>

        {/* Preferences */}
        <Fade delay={110}>
          <SectionLbl label="Preferensi" />
          <View style={{ paddingHorizontal: 18, marginBottom: 22 }}>
            <Card radius={18} noPad>
              <SettingRow
                icon="shield-off" iconColor={C.teal}
                label="Tanpa Watermark"
                sub="Hapus watermark platform jika tersedia"
                showChevron={false}
                right={
                  <Switch
                    value={settings?.preferNoWatermark ?? true}
                    onValueChange={v => { Haptics.selectionAsync(); updateSetting('preferNoWatermark', v) }}
                    trackColor={{ false: C.white10, true: C.teal }}
                    thumbColor="#fff"
                  />
                }
              />
              <SettingRow
                icon="image" iconColor={C.blue}
                label="Auto Simpan ke Galeri"
                sub="Otomatis simpan ke camera roll"
                isLast
                showChevron={false}
                right={
                  <Switch
                    value={settings?.autoSaveToGallery ?? true}
                    onValueChange={v => { Haptics.selectionAsync(); updateSetting('autoSaveToGallery', v) }}
                    trackColor={{ false: C.white10, true: C.blue }}
                    thumbColor="#fff"
                  />
                }
              />
            </Card>
          </View>
        </Fade>

        {/* Storage */}
        <Fade delay={160}>
          <SectionLbl label="Penyimpanan" />
          <View style={{ paddingHorizontal: 18, marginBottom: 22 }}>
            <Card radius={18} noPad>
              <SettingRow icon="hard-drive" iconColor="#FBBF24" label="Kelola Penyimpanan" sub="Konfigurasi lokasi download"     onPress={() => {}} />
              <SettingRow icon="trash-2"    iconColor={C.error} label="Hapus Cache"        sub="Hapus file download sementara"   onPress={handleClearCache} />
              <SettingRow icon="clock"      iconColor={C.error} label="Hapus Riwayat"      sub="Hapus semua catatan download"    onPress={handleClearHistory} isLast />
            </Card>
          </View>
        </Fade>

        {/* About */}
        <Fade delay={210}>
          <SectionLbl label="Tentang" />
          <View style={{ paddingHorizontal: 18, marginBottom: 22 }}>
            <Card radius={18} noPad>
              <View style={g.aboutRow}>
                <View style={g.aboutLogo}>
                  <LinearGradient colors={[C.blue, C.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                  <Feather name="download-cloud" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={g.aboutName}>SaveFlow</Text>
                  <Text style={g.aboutVer}>Versi 2.0.0</Text>
                  <Text style={g.aboutTag}>Downloader video tercepat{'\n'}untuk semua platform favoritmu.</Text>
                </View>
              </View>
              <View style={g.sep} />
              <SettingRow icon="star"        iconColor="#FBBF24"   label="Beri Rating"       onPress={() => {}} />
              <SettingRow icon="help-circle" iconColor={C.blue}    label="Dukungan"          onPress={() => {}} />
              <SettingRow icon="shield"      iconColor={C.teal}    label="Kebijakan Privasi" onPress={() => {}} />
              <SettingRow icon="file-text"   iconColor={C.white40} label="Syarat Layanan"    onPress={() => {}} isLast />
            </Card>
          </View>
        </Fade>

        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={g.footer}>© 2025 SaveFlow. Hak cipta dilindungi.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const g = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 24 },
  title:  { fontSize: 26, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.6 },
  sub:    { fontSize: 13, color: C.white40, marginTop: 4, fontFamily: 'PlusJakartaSans_400Regular' },

  qualHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingBottom: 12 },
  qualIcon:   { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  qualLabel:  { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  qualSub:    { fontSize: 11, color: C.white40, marginTop: 2, fontFamily: 'PlusJakartaSans_400Regular' },
  qualRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  qualPill:   { flex: 1, overflow: 'hidden', paddingVertical: 10, borderRadius: 50, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  qualPillActive:    { borderColor: 'transparent' },
  qualPillTxt:       { fontSize: 13, fontWeight: '600', color: C.white40, fontFamily: 'PlusJakartaSans_600SemiBold' },
  qualPillTxtActive: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

  aboutRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  aboutLogo: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  aboutName: { fontSize: 16, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  aboutVer:  { fontSize: 11, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 2 },
  aboutTag:  { fontSize: 11, color: C.white40, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 5, lineHeight: 16 },
  sep:       { height: 1, backgroundColor: C.borderSub, marginHorizontal: 16, marginBottom: 4 },

  footer: { fontSize: 11, color: C.white20, fontFamily: 'PlusJakartaSans_400Regular' },
})
