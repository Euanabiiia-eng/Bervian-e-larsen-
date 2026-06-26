import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../lib/api'

export default function PacientesScreen() {
  const [pacientes, setPacientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/clinic/pacientes')
      setPacientes(data.data ?? [])
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [])

  const filtered = search.trim()
    ? pacientes.filter(p => {
        const q = search.toLowerCase()
        return (
          (p.user?.nome ?? '').toLowerCase().includes(q) ||
          (p.user?.email ?? '').toLowerCase().includes(q)
        )
      })
    : pacientes

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Pacientes</Text>
          <Text style={s.headerSub}>{pacientes.length} CADASTRADOS</Text>
        </View>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar paciente..."
          placeholderTextColor="#4A4440"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Text style={s.clearBtn} onPress={() => setSearch('')}>✕</Text>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#8B6914" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load() }}
              tintColor="#8B6914"
            />
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>◎</Text>
              <Text style={s.emptyText}>
                {search ? 'Nenhum resultado' : 'Nenhum paciente cadastrado'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const nome = item.user?.nome ?? '—'
            const email = item.user?.email ?? '—'
            const count = item._count?.cirurgias ?? 0
            const initial = nome[0].toUpperCase()
            return (
              <View style={s.item}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{nome}</Text>
                  <Text style={s.email}>{email}</Text>
                </View>
                <View style={s.badge}>
                  <Text style={s.badgeNum}>{count}</Text>
                  <Text style={s.badgeLbl}>cirurg.</Text>
                </View>
              </View>
            )
          }}
        />
      )}
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
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1918', borderBottomWidth: 1, borderBottomColor: '#2A2820',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  searchInput: {
    flex: 1, fontFamily: 'Jost_300Light', fontSize: 13,
    color: '#F7F2EA', paddingVertical: 6,
  },
  clearBtn: { fontFamily: 'Jost_300Light', fontSize: 12, color: '#6A6458', paddingLeft: 12 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1E1D1B',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2820',
    borderWidth: 1, borderColor: '#3A3830', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 20, color: '#D4B87A' },
  name: { fontFamily: 'Jost_400Regular', fontSize: 14, color: '#F7F2EA' },
  email: { fontFamily: 'Jost_300Light', fontSize: 11, color: '#6A6458', marginTop: 2 },
  badge: { alignItems: 'center' },
  badgeNum: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 20, color: '#8B6914' },
  badgeLbl: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 32, color: '#2A2820', marginBottom: 16 },
  emptyText: { fontFamily: 'Jost_300Light', fontSize: 13, color: '#6A6458' },
})
