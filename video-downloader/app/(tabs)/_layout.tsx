import React, { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { C } from '@/constants/colors'

const PILL_W_ON  = 126
const PILL_W_OFF = 46

const TABS = [
  { name: 'index',    label: 'Beranda',    icon: 'home-outline'     as const, iconOn: 'home'     as const },
  { name: 'history',  label: 'Riwayat',    icon: 'time-outline'     as const, iconOn: 'time'     as const },
  { name: 'settings', label: 'Pengaturan', icon: 'settings-outline' as const, iconOn: 'settings' as const },
]

function TabPill({ tab, focused, onPress }: {
  tab: typeof TABS[number]
  focused: boolean
  onPress: () => void
}) {
  const pillW  = useSharedValue(focused ? PILL_W_ON : PILL_W_OFF)
  const textOp = useSharedValue(focused ? 1 : 0)

  useEffect(() => {
    pillW.value  = withSpring(focused ? PILL_W_ON : PILL_W_OFF, { damping: 22, stiffness: 260 })
    textOp.value = withTiming(focused ? 1 : 0, { duration: focused ? 200 : 80 })
  }, [focused])

  const pillStyle = useAnimatedStyle(() => ({ width: pillW.value }))
  const textStyle = useAnimatedStyle(() => ({ opacity: textOp.value }))

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Haptics.selectionAsync()}
    >
      <Animated.View
        style={[
          styles.pill,
          focused ? styles.pillOn : styles.pillOff,
          pillStyle,
        ]}
      >
        <Ionicons
          name={focused ? tab.iconOn : tab.icon}
          size={20}
          color={focused ? C.accent : '#5A5A5A'}
        />
        <Animated.Text style={[styles.pillLabel, textStyle]} numberOfLines={1}>
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  )
}

function PillTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[styles.barOuter, { bottom: Math.max(insets.bottom, 8) + 8 }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {state.routes.map((route: any, i: number) => {
          const tab = TABS.find(t => t.name === route.name)
          if (!tab) return null
          return (
            <TabPill
              key={route.key}
              tab={tab}
              focused={state.index === i}
              onPress={() => navigation.navigate(route.name)}
            />
          )
        })}
      </View>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <PillTabBar state={props.state} navigation={props.navigation} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    />
      <Tabs.Screen name="history"  />
      <Tabs.Screen name="settings" />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  barOuter: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181818',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#282828',
    paddingHorizontal: 10,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  pill: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    overflow: 'hidden',
    paddingHorizontal: 11,
  },
  pillOn: {
    backgroundColor: 'rgba(200,245,0,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(200,245,0,0.35)',
  },
  pillOff: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  pillLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: C.accent,
    letterSpacing: 0.2,
  },
})
