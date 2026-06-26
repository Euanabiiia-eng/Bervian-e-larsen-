import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function Icon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '◈',
    cirurgia: '✦',
    pacientes: '◎',
    perfil: '○',
  }
  return (
    <Text style={{ fontSize: 15, color: focused ? '#D4B87A' : '#6A6458' }}>
      {icons[name] ?? '·'}
    </Text>
  )
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1918',
          borderTopColor: '#2A2820',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: '#D4B87A',
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
          title: 'PAINEL',
          tabBarIcon: ({ focused }) => <Icon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cirurgia"
        options={{
          title: 'CIRURGIA',
          tabBarIcon: ({ focused }) => <Icon name="cirurgia" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          title: 'PACIENTES',
          tabBarIcon: ({ focused }) => <Icon name="pacientes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'PERFIL',
          tabBarIcon: ({ focused }) => <Icon name="perfil" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
