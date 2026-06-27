import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import React, { useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, interpolateColor,
} from 'react-native-reanimated'
import { C } from '@/constants/colors'

const { width: W } = Dimensions.get('window')

const TABS = [
  { name: 'index',    icon: 'home',     label: 'Home'     },
  { name: 'history',  icon: 'clock',    label: 'History'  },
  { name: 'settings', icon: 'sliders',  label: 'Settings' },
]

function TabItem({
  icon, label, focused, onPress,
}: {
  icon: string; label: string; focused: boolean; onPress: () => void
}) {
  const expand = useSharedValue(focused ? 1 : 0)
  const sc     = useSharedValue(1)

  useEffect(() => {
    expand.value = withSpring(focused ? 1 : 0, { damping: 20, stiffness: 260, mass: 0.8 })
  }, [focused])

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${expand.value * 0.12})`,
    paddingHorizontal: 10 + expand.value * 10,
    borderRadius: 50,
  }))

  const labelStyle = useAnimatedStyle(() => ({
    opacity: expand.value,
    maxWidth: expand.value * 72,
    marginLeft: expand.value * 6,
  }))

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        Haptics.selectionAsync()
        sc.value = withSpring(0.88, { damping: 14, stiffness: 320 })
      }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 12, stiffness: 260 }) }}
      style={b.tabPress}
    >
      <Animated.View style={[b.tabInner, scaleStyle]}>
        <Animated.View style={[b.pill, pillStyle]}>
          <Feather
            name={icon as any}
            size={20}
            color={focused ? '#fff' : 'rgba(255,255,255,0.35)'}
          />
          <Animated.Text
            style={[b.label, labelStyle]}
            numberOfLines={1}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets()

  const handlePress = useCallback((name: string) => {
    navigation.navigate(name)
  }, [navigation])

  return (
    <View style={[b.barWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={b.bar}>
        {state.routes.map((route: any, i: number) => {
          const tab     = TABS.find(t => t.name === route.name)
          const focused = state.index === i
          if (!tab) return null
          return (
            <TabItem
              key={route.key}
              icon={tab.icon}
              label={tab.label}
              focused={focused}
              onPress={() => handlePress(route.name)}
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
      tabBar={props => <CustomTabBar state={props.state} navigation={props.navigation} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    />
      <Tabs.Screen name="history"  />
      <Tabs.Screen name="settings" />
    </Tabs>
  )
}

const b = StyleSheet.create({
  barWrap: {
    alignItems: 'center',
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0E1130',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.55,
    elevation: 20,
    minWidth: W * 0.72,
  },
  tabPress:  { alignItems: 'center', justifyContent: 'center' },
  tabInner:  { alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#fff',
    overflow: 'hidden',
  },
})
