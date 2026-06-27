import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    async function check() {
      try {
        const welcomed = await AsyncStorage.getItem('welcomed')
        if (welcomed) {
          router.replace('/(tabs)' as any)
        } else {
          router.replace('/welcome' as any)
        }
      } catch {
        router.replace('/welcome' as any)
      }
    }
    check()
  }, [])

  return null
}
