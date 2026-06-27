import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import React, { useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated'
import { C } from '@/constants/colors'

const { width: W } = Dimensions.get('window')

const TABS = [
  { name: 'index',    icon: 'home',    label: 'Home'      },
  { name: 'paste',    icon: 'plus',    label: 'Download', center: true },
  { name: 'history',  icon: 'clock',   label: 'History'   },
  { name: 'settings', icon: 'sliders', label: 'Settings'  },
]

function TabItem({ icon, label, focused, onPress }: {
  icon: string; label: string; focused: boolean; onPress: () => void
}) {
  const sc = useSharedValue(1)
  const pressIn  = () => { sc.value = withSpring(0.85, { damping: 12, stiffness: 300 }) }
  const pressOut = () => { sc.value = withSpring(1,    { damping: 10, stiffness: 240 }) }
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))

  useEffect(() => {
    if (focused) {
      sc.value = withSpring(1.10, { damping: 8, stiffness: 260 }, () => {
        sc.value = withSpring(1, { damping: 10, stiffness: 240 })
      })
    }
  }, [focused])

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={b.tab}>
      <Animated.View style={[b.tabInner, animStyle]}>
        <View style={[b.iconWrap, focused && b.iconWrapActive]}>
          <Feather name={icon as any} size={20}
            color={focused ? C.blue : 'rgba(255,255,255,0.30)'} />
        </View>
        <Text style={[b.label, focused && b.labelActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

function CenterTab({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const sc = useSharedValue(1)
  const pressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    sc.value = withSpring(0.88, { damping: 12, stiffness: 300 })
  }
  const pressOut = () => { sc.value = withSpring(1, { damping: 10, stiffness: 240 }) }
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={b.centerTab}>
      <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
        <View style={b.glowRing} />
        <LinearGradient
          colors={['#4F80FF', '#00CCAB']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={b.centerBtn}
        >
          <Feather name="download" size={24} color="#fff" />
        </LinearGradient>
        <Text style={[b.label, { marginTop: 6, color: focused ? C.blue : 'rgba(255,255,255,0.30)' }]}>
          Download
        </Text>
      </Animated.View>
    </Pressable>
  )
}

function PillIndicator({ activeIndex, tabCount }: { activeIndex: number; tabCount: number }) {
  const tabW = W / tabCount
  const x = useSharedValue(activeIndex * tabW + tabW / 2 - 22)

  useEffect(() => {
    x.value = withSpring(activeIndex * tabW + tabW / 2 - 22, { damping: 18, stiffness: 200 })
  }, [activeIndex])

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))

  return (
    <Animated.View pointerEvents="none" style={[b.pill, style]} />
  )
}

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets()

  const handlePress = useCallback((name: string) => {
    Haptics.selectionAsync()
    navigation.navigate(name)
  }, [navigation])

  return (
    <View style={[b.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,10,22,0.97)' }]} />
      <View style={b.topBorder} />
      <PillIndicator activeIndex={state.index} tabCount={state.routes.length} />

      {state.routes.map((route: any, i: number) => {
        const tab     = TABS.find(t => t.name === route.name)
        const focused = state.index === i
        if (!tab) return null

        if (tab.center) {
          return (
            <CenterTab key={route.key} focused={focused}
              onPress={() => handlePress(route.name)} />
          )
        }
        return (
          <TabItem key={route.key} icon={tab.icon} label={tab.label}
            focused={focused} onPress={() => handlePress(route.name)} />
        )
      })}
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar state={props.state} navigation={props.navigation} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    />
      <Tabs.Screen name="paste"    />
      <Tabs.Screen name="history"  />
      <Tabs.Screen name="settings" />
    </Tabs>
  )
}

const b = StyleSheet.create({
  bar:           { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowRadius: 28, shadowOpacity: 0.7, elevation: 36 },
  topBorder:     { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(79,128,255,0.12)' },
  pill:          { position: 'absolute', top: 0, width: 44, height: 3, borderRadius: 2, backgroundColor: C.blue },
  tab:           { flex: 1, paddingTop: 10, paddingBottom: 4, alignItems: 'center' },
  tabInner:      { alignItems: 'center', gap: 4 },
  iconWrap:      { width: 44, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive:{ backgroundColor: 'rgba(79,128,255,0.13)' },
  label:         { fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: 'PlusJakartaSans_500Medium' },
  labelActive:   { color: C.blue, fontFamily: 'PlusJakartaSans_600SemiBold' },
  centerTab:     { flex: 1, alignItems: 'center', paddingBottom: 4, paddingTop: 2 },
  glowRing:      { position: 'absolute', width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(79,128,255,0.16)', top: -8, zIndex: 0 },
  centerBtn:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, shadowOpacity: 0.65, elevation: 18, zIndex: 1 },
})