import { Redirect } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const [checking, setChecking] = useState(true)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync('apice_access_token').then((t) => {
      setHasToken(!!t)
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0E0D0C' }}>
        <ActivityIndicator color="#8B6914" />
      </View>
    )
  }

  return <Redirect href={hasToken ? '/(patient)' : '/(auth)/login'} />
}
