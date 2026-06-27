import { Tabs } from 'expo-router'
import React, { useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { C } from '@/constants/colors'

const { width: W } = Dimensions.get('window')

const TABS = [
  { name: 'index',    icon: 'home-outline' as const,     iconOn: 'home' as const,     label: 'Beranda'    },
  { name: 'history',  icon: 'time-outline' as const,     iconOn: 'time' as const,     label: 'Riwayat'    },
  { name: 'settings', icon: 'settings-outline' as const, iconOn: 'settings' as const, label: 'Pengaturan' },
]

function TabItem({
  icon, iconOn, label, focused, onPress,
}: {
  icon: any; iconOn: any; label: string; focused: boolean; onPress: () => void
}) {
  const sc = useSharedValue(1)

  useEffect(() => {
    sc.value = withSpring(focused ? 1 : 1, { damping: 20, stiffness: 260 })
  }, [focused])

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }],
  }))

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        Haptics.selectionAsync()
        sc.value = withSpring(0.88, { damping: 14, stiffness: 320 })
      }}
      onPressOut={() => {
        sc.value = withSpring(1, { damping: 12, stiffness: 260 })
      }}
      style={b.tabPress}
    >
      <Animated.View style={[b.tabInner, pressStyle]}>
        <View style={[b.iconWrap, focused && { backgroundColor: C.accentDim }]}>
          <Ionicons
            name={focused ? iconOn : icon}
            size={22}
            color={focused ? C.accent : C.textMuted}
          />
        </View>
        <Text style={[b.label, { color: focused ? C.accent : C.textMuted }]}>
          {label}
        </Text>
        {focused && <View style={b.activeDot} />}
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
    <View style={[b.barWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={b.bar}>
        {state.routes.map((route: any, i: number) => {
          const tab     = TABS.find(t => t.name === route.name)
          const focused = state.index === i
          if (!tab) return null
          return (
            <TabItem
              key={route.key}
              icon={tab.icon}
              iconOn={tab.iconOn}
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
    backgroundColor: C.bg2,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabPress: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.accent,
    marginTop: 2,
  },
})
