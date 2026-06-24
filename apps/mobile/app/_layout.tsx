import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useFonts, CormorantGaramond_400Regular, CormorantGaramond_400Regular_Italic, CormorantGaramond_300Light_Italic } from '@expo-google-fonts/cormorant-garamond'
import { Jost_200ExtraLight, Jost_300Light, Jost_400Regular, Jost_500Medium } from '@expo-google-fonts/jost'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_300Light_Italic,
    Jost_200ExtraLight,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}
