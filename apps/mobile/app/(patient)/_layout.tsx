import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '◇',
    documentos: '⊞',
    videos: '▷',
    chat: '◉',
    perfil: '○',
  }
  return (
    <Text style={{ fontSize: 14, color: focused ? '#8B6914' : '#6A6458' }}>
      {icons[name] ?? '·'}
    </Text>
  )
}

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0E0D0C',
          borderTopColor: '#2A2820',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: '#8B6914',
        tabBarInactiveTintColor: '#6A6458',
        tabBarLabelStyle: {
          fontFamily: 'Jost_300Light',
          fontSize: 9,
          letterSpacing: 1.5,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'JORNADA',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'DOCS',
          tabBarIcon: ({ focused }) => <TabIcon name="documentos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'VÍDEOS',
          tabBarIcon: ({ focused }) => <TabIcon name="videos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'CHAT',
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'PERFIL',
          tabBarIcon: ({ focused }) => <TabIcon name="perfil" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
