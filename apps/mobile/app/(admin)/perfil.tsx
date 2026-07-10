import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  MEDICO: 'Médico',
  PACIENTE: 'Paciente',
}

export default function PerfilScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const initial = (user?.nome ?? 'A')[0].toUpperCase()

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Perfil</Text>
        <Text style={s.headerSub}>CONTA</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Avatar hero */}
        <View style={s.hero}>
          <View style={s.avatarRing}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <Text style={s.name}>{user?.nome ?? '—'}</Text>
          <View style={s.rolePill}>
            <Text style={s.roleText}>{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>E-MAIL</Text>
            <Text style={s.rowValue} numberOfLines={1}>{user?.email ?? '—'}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>CLÍNICA</Text>
            <Text style={s.rowValue}>{user?.clinic?.nome ?? '—'}</Text>
          </View>
        </View>

        {/* Decorative stat strip */}
        <View style={s.strip}>
          <View style={s.stripItem}>
            <Text style={s.stripIcon}>◈</Text>
            <Text style={s.stripLbl}>Método Black</Text>
          </View>
          <View style={s.stripDivider} />
          <View style={s.stripItem}>
            <Text style={s.stripIcon}>◇</Text>
            <Text style={s.stripLbl}>by Black Premium</Text>
          </View>
        </View>

        {/* Logout */}
        <View style={s.actions}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutText}>SAIR DA CONTA</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.version}>Método Black · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0D0C' },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#1A1918', borderBottomWidth: 1, borderBottomColor: '#2A2820',
  },
  headerTitle: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 26, color: '#D4B87A' },
  headerSub: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 2.5, marginTop: 2 },
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1, borderColor: '#D4B87A',
    backgroundColor: '#1A1918', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 40, color: '#D4B87A' },
  name: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 24, color: '#F7F2EA', marginBottom: 10 },
  rolePill: { borderWidth: 1, borderColor: '#2A2820', paddingHorizontal: 16, paddingVertical: 4 },
  roleText: { fontFamily: 'Jost_200ExtraLight', fontSize: 9, color: '#8B6914', letterSpacing: 2.5 },
  card: {
    marginHorizontal: 20, backgroundColor: '#1A1918',
    borderWidth: 1, borderColor: '#2A2820', padding: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  rowLabel: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 2.5, width: 60 },
  rowValue: { fontFamily: 'Jost_300Light', fontSize: 13, color: '#F7F2EA', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#2A2820', marginVertical: 16 },
  strip: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16,
    backgroundColor: '#1A1918', borderWidth: 1, borderColor: '#2A2820',
  },
  stripItem: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 6 },
  stripDivider: { width: 1, backgroundColor: '#2A2820' },
  stripIcon: { fontSize: 18, color: '#8B6914' },
  stripLbl: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 2 },
  actions: { paddingHorizontal: 20, marginTop: 32 },
  logoutBtn: {
    borderWidth: 1, borderColor: '#EF5350', paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#EF5350', letterSpacing: 3 },
  version: { fontFamily: 'Jost_200ExtraLight', fontSize: 9, color: '#2A2820', textAlign: 'center', marginTop: 32, letterSpacing: 2 },
})
