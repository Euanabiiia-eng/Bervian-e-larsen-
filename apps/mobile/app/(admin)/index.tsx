import { useCallback, useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

const PERIODS = [
  { key: 'semana', label: 'SEMANA' },
  { key: 'mes',    label: 'MÊS' },
  { key: 'trimestre', label: 'TRIMESTRE' },
  { key: 'ano',    label: 'ANO' },
]

function fmtMoney(v?: number) {
  if (!v) return '—'
  if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(0) + 'k'
  return 'R$ ' + v.toLocaleString('pt-BR')
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [period, setPeriod] = useState('mes')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (p = period) => {
    try {
      const res = await api.get(`/clinic/dashboard?period=${p}`)
      setData(res.data.data)
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => { load() }, [])

  const onRefresh = () => { setRefreshing(true); load() }

  const changePeriod = (p: string) => {
    setPeriod(p)
    setLoading(true)
    load(p)
  }

  const k = data?.kpis ?? {}
  const cirurgias: any[] = data?.proximasCirurgias ?? []
  const chartData: any[] = (data?.charts?.cirurgiasMes ?? []).slice(-6)
  const chartMax = Math.max(...chartData.map((d: any) => d.total ?? 0), 1)

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Painel</Text>
          <Text style={s.headerSub}>{user?.clinic?.nome ?? 'CLÍNICA'}</Text>
        </View>
        <TouchableOpacity
          style={s.avatar}
          onPress={() => router.push('/(admin)/perfil')}
        >
          <Text style={s.avatarText}>
            {(user?.nome ?? 'A')[0].toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Period Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsWrap} contentContainerStyle={s.tabs}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[s.tab, period === p.key && s.tabActive]}
            onPress={() => changePeriod(p.key)}
          >
            <Text style={[s.tabText, period === p.key && s.tabTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B6914" />}
      >
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#8B6914" />
          </View>
        ) : (
          <>
            {/* KPIs */}
            <View style={s.kpiGrid}>
              <View style={[s.kpi, s.kpiAccent]}>
                <Text style={s.kpiLbl}>ATENDIMENTOS</Text>
                <Text style={s.kpiVal}>{k.atendimentos ?? '—'}</Text>
                <Text style={[s.kpiDelta, (k.atendimentosVar ?? 0) >= 0 ? s.up : s.dn]}>
                  {(k.atendimentosVar ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(k.atendimentosVar ?? 0)}%
                </Text>
                <Text style={s.kpiIcon}>✦</Text>
              </View>
              <View style={[s.kpi, s.kpiAccent]}>
                <Text style={s.kpiLbl}>RECEITA</Text>
                <Text style={s.kpiVal}>{fmtMoney(k.receita)}</Text>
                <Text style={[s.kpiDelta, (k.receitaVar ?? 0) >= 0 ? s.up : s.dn]}>
                  {(k.receitaVar ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(k.receitaVar ?? 0)}%
                </Text>
                <Text style={s.kpiIcon}>◈</Text>
              </View>
              <View style={s.kpi}>
                <Text style={s.kpiLbl}>AGENDADAS</Text>
                <Text style={s.kpiVal}>{k.cirurgiasAgendadas ?? '—'}</Text>
                <Text style={[s.kpiDelta, s.nt]}>cirurgias</Text>
                <Text style={s.kpiIcon}>◎</Text>
              </View>
              <View style={s.kpi}>
                <Text style={s.kpiLbl}>TICKET MÉDIO</Text>
                <Text style={s.kpiVal}>{fmtMoney(k.ticketMedio)}</Text>
                <Text style={[s.kpiDelta, s.nt]}>por cirurgia</Text>
                <Text style={s.kpiIcon}>◇</Text>
              </View>
            </View>

            {/* Mini bar chart */}
            {chartData.length > 0 && (
              <View style={s.chartCard}>
                <Text style={s.sectionTitle}>CIRURGIAS — 6 MESES</Text>
                <View style={s.bars}>
                  {chartData.map((d: any, i: number) => {
                    const h = Math.max(4, Math.round(((d.total ?? 0) / chartMax) * 80))
                    return (
                      <View key={i} style={s.barWrap}>
                        <Text style={s.barVal}>{d.total ?? 0}</Text>
                        <View style={[s.bar, { height: h, opacity: 0.4 + 0.6 * ((d.total ?? 0) / chartMax) }]} />
                        <Text style={s.barLbl}>{d.mes}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Próximas cirurgias */}
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>PRÓXIMAS CIRURGIAS</Text>
                <TouchableOpacity onPress={() => router.push('/(admin)/cirurgia')}>
                  <Text style={s.sectionLink}>+ Nova</Text>
                </TouchableOpacity>
              </View>

              {cirurgias.length === 0 ? (
                <Text style={s.emptyText}>Nenhuma cirurgia agendada</Text>
              ) : (
                cirurgias.slice(0, 5).map((c: any) => (
                  <View key={c.id} style={s.surgItem}>
                    <View style={s.surgAvatar}>
                      <Text style={s.surgAvatarText}>
                        {(c.paciente?.user?.nome ?? 'P')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.surgName}>{c.paciente?.user?.nome ?? '—'}</Text>
                      <Text style={s.surgProc}>{c.procedimento?.nome ?? '—'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.surgDate}>{fmtDate(c.data)}</Text>
                      <Text style={s.surgTime}>{c.horaInicio ?? '—'}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* CTA */}
            <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
              <TouchableOpacity
                style={s.ctaBtn}
                onPress={() => router.push('/(admin)/cirurgia')}
              >
                <Text style={s.ctaBtnText}>✦ AGENDAR NOVA CIRURGIA</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0D0C' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    backgroundColor: '#1A1918', borderBottomWidth: 1, borderBottomColor: '#2A2820',
  },
  headerTitle: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 26, color: '#D4B87A' },
  headerSub: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 2.5, marginTop: 2 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#8B6914',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Jost_500Medium', fontSize: 16, color: '#0E0D0C' },
  tabsWrap: { backgroundColor: '#1A1918', borderBottomWidth: 1, borderBottomColor: '#2A2820', flexGrow: 0 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#D4B87A' },
  tabText: { fontFamily: 'Jost_300Light', fontSize: 9, color: '#6A6458', letterSpacing: 1.5 },
  tabTextActive: { color: '#D4B87A' },
  kpiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 16,
  },
  kpi: {
    width: '49.5%', backgroundColor: '#2A2820', padding: 14,
    borderLeftWidth: 2, borderLeftColor: '#2A2820', position: 'relative', overflow: 'hidden',
  },
  kpiAccent: { borderLeftColor: '#8B6914' },
  kpiLbl: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 2, marginBottom: 8 },
  kpiVal: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 24, color: '#F7F2EA' },
  kpiDelta: { fontFamily: 'Jost_300Light', fontSize: 10, marginTop: 4 },
  kpiIcon: { position: 'absolute', bottom: 4, right: 8, fontSize: 32, color: '#F7F2EA', opacity: 0.04 },
  up: { color: '#66BB6A' }, dn: { color: '#EF5350' }, nt: { color: '#6A6458' },
  chartCard: {
    marginHorizontal: 16, marginTop: 0, backgroundColor: '#1A1918',
    borderWidth: 1, borderColor: '#2A2820', padding: 16,
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, marginTop: 12, gap: 4 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '100%', backgroundColor: '#8B6914', borderRadius: 1 },
  barVal: { fontFamily: 'Jost_300Light', fontSize: 9, color: '#D4B87A' },
  barLbl: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 3, textTransform: 'uppercase' },
  sectionLink: { fontFamily: 'Jost_300Light', fontSize: 11, color: '#8B6914' },
  emptyText: { fontFamily: 'Jost_300Light', fontSize: 12, color: '#6A6458', textAlign: 'center', paddingVertical: 20 },
  surgItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2820',
  },
  surgAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2A2820',
    borderWidth: 1, borderColor: '#8B6914', alignItems: 'center', justifyContent: 'center',
  },
  surgAvatarText: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 18, color: '#D4B87A' },
  surgName: { fontFamily: 'Jost_400Regular', fontSize: 13, color: '#F7F2EA' },
  surgProc: { fontFamily: 'Jost_300Light', fontSize: 11, color: '#6A6458', marginTop: 2 },
  surgDate: { fontFamily: 'Jost_400Regular', fontSize: 13, color: '#D4B87A' },
  surgTime: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#6A6458', marginTop: 2 },
  ctaBtn: { backgroundColor: '#8B6914', padding: 16, alignItems: 'center', marginTop: 8 },
  ctaBtnText: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#0E0D0C', letterSpacing: 3 },
})
