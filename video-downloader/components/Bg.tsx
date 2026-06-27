import React from 'react'
import { View, StyleSheet } from 'react-native'
import { C } from '@/constants/colors'

export default function Bg() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]} pointerEvents="none" />
}
