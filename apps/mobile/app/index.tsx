import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../hooks/useAuth'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0E0D0C' }}>
        <ActivityIndicator color="#8B6914" />
      </View>
    )
  }

  if (!user) return <Redirect href="/(auth)/login" />

  const isAdmin = user.role === 'ADMIN' || user.role === 'MEDICO'
  return <Redirect href={isAdmin ? '/(admin)' : '/(patient)'} />
}
