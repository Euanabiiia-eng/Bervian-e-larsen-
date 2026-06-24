import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import colors from '../../constants/colors'

function TabIcon({ focused, emoji, label }: { focused: boolean; emoji: string; label: string }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function PatientTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="⌂" label="Home" />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="◻" label="Docs" />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="▷" label="Vídeos" />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="◇" label="Chat" />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="○" label="Perfil" />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.inkDim,
    borderTopColor: colors.inkPale + '30',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 18,
    color: colors.inkPale,
  },
  emojiActive: {
    color: colors.gold,
  },
  tabLabel: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 9,
    color: colors.inkPale,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: colors.gold,
  },
})
