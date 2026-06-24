import { useCallback, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePatient } from '../../hooks/usePatient'
import { formatDate } from '@apice/utils'

const SCREEN_W = Dimensions.get('window').width

const jornadaIcons: Record<string, string> = {
  consulta: '✓',
  confirmacao: '✓',
  exames: '◈',
  docs: '⊞',
  prep: '◎',
  internacao: '⌂',
  cirurgia: '✦',
  pos: '♧',
}

const jornadaColors: Record<string, string> = {
  done: '#3D6B4F',
  active: '#8B6914',
  pending: '#6A6458',
}

export default function HomeScreen() {
  const { paciente, jornada, checklist, loading, refetch } = usePatient()
  const [refreshing, setRefreshing] = useState(false)
  const [modalEtapa, setModalEtapa] = useState<any>(null)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const progress = jornada.length > 0
    ? Math.round((jornada.filter((e: any) => e.status === 'done').length / jornada.length) * 100)
    : 0

  const proximaAcao = jornada.find((e: any) => e.status === 'active') ??
    jornada.find((e: any) => e.status === 'pending')

  const checklistPendente = checklist.filter((c: any) => !c.feito).length

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#8B6914', fontFamily: 'Jost_300Light' }}>Carregando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B6914" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>Á</Text>
            </View>
            <Text style={styles.clinicName}>
              {paciente?.clinic?.nome ?? 'Clínica'}
            </Text>
          </View>
          <Text style={styles.greeting}>
            Olá, {paciente?.user?.nome?.split(' ')[0] ?? 'Paciente'}.
          </Text>
          <Text style={styles.greeting2}>Sua jornada está em andamento.</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.section}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progresso da jornada</Text>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Info Grid */}
        {paciente?.dataCirurgia && (
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>CIRURGIA</Text>
              <Text style={styles.infoValue}>{formatDate(paciente.dataCirurgia)}</Text>
              {paciente.horaCirurgia && (
                <Text style={styles.infoSub}>{paciente.horaCirurgia}h</Text>
              )}
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>HOSPITAL</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {paciente?.procedimento?.hospital?.nome ?? '—'}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>MÉDICO</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {paciente?.medico?.user?.nome ?? '—'}
              </Text>
            </View>
          </View>
        )}

        {/* Lembrete */}
        {paciente?.procedimento?.lembrete && (
          <View style={styles.lembrete}>
            <Text style={styles.lembreteText}>💡 {paciente.procedimento.lembrete}</Text>
          </View>
        )}

        {/* Jornada Etapas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sua Jornada</Text>
          <View style={styles.jornadaList}>
            {jornada.map((etapa: any, idx: number) => (
              <TouchableOpacity
                key={etapa.id}
                onPress={() => setModalEtapa(etapa)}
                style={styles.etapaRow}
                activeOpacity={0.7}
              >
                <View style={[styles.etapaIcon, { borderColor: jornadaColors[etapa.status] }]}>
                  <Text style={[styles.etapaIconText, { color: jornadaColors[etapa.status] }]}>
                    {jornadaIcons[etapa.tipo] ?? '·'}
                  </Text>
                </View>
                {idx < jornada.length - 1 && (
                  <View style={[styles.etapaLine, { backgroundColor: etapa.status === 'done' ? '#3D6B4F' : '#2A2820' }]} />
                )}
                <View style={{ flex: 1, paddingLeft: 14 }}>
                  <Text style={[styles.etapaLabel, etapa.status === 'done' && styles.etapaLabelDone]}>
                    {etapa.label}
                  </Text>
                  {etapa.data && (
                    <Text style={styles.etapaData}>{etapa.data}</Text>
                  )}
                  {etapa.status === 'active' && (
                    <Text style={styles.etapaActive}>Em andamento</Text>
                  )}
                </View>
                <Text style={{ color: '#2A2820', fontSize: 12 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Próxima ação */}
        {checklistPendente > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
              <Text style={styles.actionTitle}>Checklist pendente</Text>
              <Text style={styles.actionSub}>
                {checklistPendente} item(s) a concluir antes da cirurgia
              </Text>
              <Text style={styles.actionCta}>Ver checklist →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Etapa modal */}
      <Modal
        visible={!!modalEtapa}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEtapa(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{modalEtapa?.label}</Text>
            {modalEtapa?.data && (
              <Text style={styles.modalDate}>{modalEtapa.data}</Text>
            )}
            {modalEtapa?.detalhe && (
              <Text style={styles.modalDetalhe}>{modalEtapa.detalhe}</Text>
            )}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalEtapa(null)}
            >
              <Text style={styles.modalCloseText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0D0C' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2820',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoBadge: { borderWidth: 1, borderColor: '#D4B87A', paddingHorizontal: 8, paddingVertical: 4 },
  logoText: { fontFamily: 'CormorantGaramond_400Regular_Italic', color: '#8B6914', fontSize: 16 },
  clinicName: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 11, letterSpacing: 1 },
  greeting: { fontFamily: 'CormorantGaramond_400Regular_Italic', color: '#F7F2EA', fontSize: 26 },
  greeting2: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 24, paddingTop: 24 },
  sectionTitle: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#6A6458', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#6A6458', letterSpacing: 2, textTransform: 'uppercase' },
  progressPct: { fontFamily: 'Jost_400Regular', fontSize: 12, color: '#8B6914' },
  progressTrack: { height: 2, backgroundColor: '#2A2820', borderRadius: 1 },
  progressFill: { height: 2, backgroundColor: '#8B6914', borderRadius: 1 },
  infoGrid: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 20, gap: 2 },
  infoCard: {
    flex: 1,
    backgroundColor: '#2A2820',
    padding: 12,
    alignItems: 'center',
  },
  infoLabel: { fontFamily: 'Jost_300Light', fontSize: 8, color: '#6A6458', letterSpacing: 2, marginBottom: 6 },
  infoValue: { fontFamily: 'Jost_400Regular', fontSize: 11, color: '#F7F2EA', textAlign: 'center' },
  infoSub: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#8B6914', marginTop: 2 },
  lembrete: {
    marginHorizontal: 24,
    marginTop: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#8B6914',
    paddingLeft: 12,
    paddingVertical: 8,
  },
  lembreteText: { fontFamily: 'Jost_300Light', color: '#D4B87A', fontSize: 12, lineHeight: 18 },
  jornadaList: { gap: 0 },
  etapaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    position: 'relative',
  },
  etapaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0D0C',
    zIndex: 1,
  },
  etapaIconText: { fontSize: 12 },
  etapaLine: {
    position: 'absolute',
    left: 15.5,
    top: 44,
    bottom: -12,
    width: 1,
  },
  etapaLabel: { fontFamily: 'Jost_400Regular', fontSize: 13, color: '#F7F2EA' },
  etapaLabelDone: { color: '#6A6458', textDecorationLine: 'line-through' },
  etapaData: { fontFamily: 'Jost_300Light', fontSize: 11, color: '#6A6458', marginTop: 2 },
  etapaActive: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#8B6914', marginTop: 2, letterSpacing: 1 },
  actionCard: {
    backgroundColor: '#2A2820',
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#8B6914',
  },
  actionTitle: { fontFamily: 'Jost_400Regular', color: '#F7F2EA', fontSize: 14 },
  actionSub: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 12, marginTop: 4 },
  actionCta: { fontFamily: 'Jost_400Regular', color: '#8B6914', fontSize: 12, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#2A2820',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: { width: 32, height: 3, backgroundColor: '#6A6458', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'CormorantGaramond_400Regular_Italic', color: '#F7F2EA', fontSize: 22, marginBottom: 4 },
  modalDate: { fontFamily: 'Jost_300Light', color: '#8B6914', fontSize: 12, marginBottom: 16 },
  modalDetalhe: { fontFamily: 'Jost_300Light', color: '#D4B87A', fontSize: 13, lineHeight: 22 },
  modalClose: { marginTop: 24, alignSelf: 'flex-start' },
  modalCloseText: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 10, letterSpacing: 3 },
})
