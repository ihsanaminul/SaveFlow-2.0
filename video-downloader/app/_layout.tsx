import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { Feather } from '@expo/vector-icons'
import * as Font from 'expo-font'
import React, { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { historyService } from '@/services/history'
import { settingsService } from '@/services/settings'
import { useStore } from '@/store/useStore'
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })
  const [iconsLoaded] = Font.useFonts({ ...Feather.font })
  const [dataLoaded, setDataLoaded] = useState(false)

  const ready = fontsLoaded && iconsLoaded && dataLoaded

  useEffect(() => {
    async function load() {
      try {
        const [history, settings] = await Promise.all([
          historyService.getHistory(),
          settingsService.getSettings(),
        ])
        useStore.getState().setHistory(history)
        useStore.getState().loadSettings(settings)
      } catch {}
      setDataLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0D' }, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}
