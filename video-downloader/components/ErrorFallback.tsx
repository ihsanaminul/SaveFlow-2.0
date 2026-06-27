import { Feather } from '@expo/vector-icons'
import { reloadAppAsync } from 'expo'
import React, { useState } from 'react'
import {
  Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C } from '@/constants/colors'

export type ErrorFallbackProps = {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const insets = useSafeAreaInsets()
  const [showModal, setShowModal] = useState(false)

  const handleRestart = async () => {
    try {
      await reloadAppAsync()
    } catch {
      resetError()
    }
  }

  const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })
  const details  = `Error: ${error.message}\n\n${error.stack ?? ''}`

  return (
    <View style={[s.container, { backgroundColor: C.bg }]}>
      {__DEV__ && (
        <Pressable
          onPress={() => setShowModal(true)}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={[s.topBtn, { top: insets.top + 16, backgroundColor: C.white10 }]}
        >
          <Feather name="alert-circle" size={20} color="#fff" />
        </Pressable>
      )}

      <View style={s.content}>
        <View style={s.iconWrap}>
          <LinearGradient
            colors={['#F87171', '#DC2626']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
          <Feather name="alert-triangle" size={36} color="#fff" />
        </View>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.message}>Please reload the app to continue.</Text>
        <Pressable onPress={handleRestart} style={s.btn}>
          <LinearGradient
            colors={['#C4B5FD', '#A78BFA', '#7B61FF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          />
          <Text style={s.btnText}>Try Again</Text>
        </Pressable>
      </View>

      {__DEV__ && (
        <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
          <View style={s.overlay}>
            <View style={[s.modal, { backgroundColor: C.bg2 }]}>
              <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
                <Text style={s.modalTitle}>Error Details</Text>
                <Pressable onPress={() => setShowModal(false)} style={s.closeBtn}>
                  <Feather name="x" size={24} color="#fff" />
                </Pressable>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
                showsVerticalScrollIndicator
              >
                <View style={s.errorBox}>
                  <Text style={[s.errorText, { fontFamily: monoFont }]} selectable>
                    {details}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 24 },
  content:     { alignItems: 'center', justifyContent: 'center', gap: 16, width: '100%', maxWidth: 600 },
  topBtn:      { position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  iconWrap:    { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 6 },
  title:       { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#fff' },
  message:     { fontSize: 15, textAlign: 'center', lineHeight: 22, color: C.white60 },
  btn:         { paddingVertical: 15, borderRadius: 14, paddingHorizontal: 28, minWidth: 200, alignItems: 'center', overflow: 'hidden' },
  btnText:     { fontWeight: '700', textAlign: 'center', fontSize: 15, color: '#fff' },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:       { width: '100%', height: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: '#fff' },
  closeBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  errorBox:    { width: '100%', borderRadius: 12, overflow: 'hidden', padding: 16, backgroundColor: 'rgba(255,255,255,0.07)' },
  errorText:   { fontSize: 12, lineHeight: 18, width: '100%', color: C.white60 },
})
