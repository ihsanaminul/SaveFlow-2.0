import React, { memo } from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const { width: W, height: H } = Dimensions.get('window')
const BLOB = 320

export const MeshBackground = memo(function MeshBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={s.root}>
      <View style={[s.blob, { top: -120, left: -100 }]} pointerEvents="none">
        <LinearGradient colors={['rgba(123,77,255,0.22)', 'rgba(91,47,223,0.08)', 'transparent']} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[s.blob, { top: H * 0.28, right: -100 }]} pointerEvents="none">
        <LinearGradient colors={['rgba(154,108,255,0.18)', 'rgba(123,77,255,0.06)', 'transparent']} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[s.blob, { bottom: 60, left: -80 }]} pointerEvents="none">
        <LinearGradient colors={['rgba(91,47,223,0.15)', 'rgba(123,77,255,0.04)', 'transparent']} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </View>
      <View style={s.content}>{children}</View>
    </View>
  )
})

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#080808' },
  blob:    { position: 'absolute', width: BLOB, height: BLOB, borderRadius: BLOB / 2, overflow: 'hidden' },
  content: { flex: 1 },
})
