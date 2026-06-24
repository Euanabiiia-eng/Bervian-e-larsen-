import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useSegments } from 'expo-router'
import { useFonts } from 'expo-font'
import {
  CormorantGaramond_400Italic,
  CormorantGaramond_600Italic,
} from '@expo-google-fonts/cormorant-garamond'
import { Jost_200ExtraLight, Jost_300Light, Jost_400Regular, Jost_500Medium } from '@expo-google-fonts/jost'
import { useAuth } from '../hooks/useAuth'

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Italic,
    CormorantGaramond_600Italic,
    Jost_200ExtraLight,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
  })

  useEffect(() => {
    if (isLoading || !fontsLoaded) return
    const inAuth = segments[0] === '(auth)'
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login')
    } else if (isAuthenticated && inAuth) {
      router.replace('/(patient)/')
    }
  }, [isAuthenticated, isLoading, fontsLoaded, segments])

  if (!fontsLoaded || isLoading) return null

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
