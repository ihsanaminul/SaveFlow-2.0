import { Link, Stack } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { C } from '@/constants/colors'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[s.container, { backgroundColor: C.bg }]}>
        <Text style={[s.title, { color: C.white }]}>
          Halaman ini tidak ada.
        </Text>
        <Link href="/" style={s.link}>
          <Text style={[s.linkText, { color: C.accent2 }]}>
            Kembali ke beranda
          </Text>
        </Link>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title:     { fontSize: 20, fontWeight: 'bold' },
  link:      { marginTop: 15, paddingVertical: 15 },
  linkText:  { fontSize: 14 },
})
