import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePatient } from '../../hooks/usePatient'
import JornadaCard from '../../components/JornadaCard'
import colors from '../../constants/colors'
import type { JornadaEtapa } from '@apice/types'

function diasAte(data?: string): number | null {
  if (!data) return null
  const diff = new Date(data).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function HomeScreen() {
  const { paciente, jornada, checklist, refreshAll } = usePatient()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEtapa, setSelectedEtapa] = useState<JornadaEtapa | null>(null)

  async function onRefresh() {
    setRefreshing(true)
    await refreshAll()
    setRefreshing(false)
  }

  const nome = paciente?.user?.nome?.split(' ')[0] ?? 'Paciente'
  const clinicNome = paciente?.clinic?.nome ?? 'Ápice'
  const proc = paciente?.procedimento
  const medico = paciente?.medico
  const dias = diasAte(paciente?.dataCirurgia ?? undefined)
  const doneCt = jornada.filter((e) => e.status === 'done').length
  const pct = jornada.length > 0 ? Math.round((doneCt / jornada.length) * 100) : 0
  const proximosChecklist = checklist.filter((c) => !c.feito).slice(0, 3)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.clinicName}>{clinicNome}</Text>
          <Text style={styles.greeting}>Olá, {nome}.</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Sua Jornada</Text>
          <Text style={styles.pctNumber}>{pct}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressSub}>{doneCt} de {jornada.length} etapas concluídas</Text>
        </View>

        {/* Surgery Info */}
        {proc && (
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>
                {dias !== null ? (dias === 0 ? 'Hoje' : dias > 0 ? `${dias}d` : 'Realizada') : '—'}
              </Text>
              <Text style={styles.infoLabel}>Para a cirurgia</Text>
            </View>
            <View style={styles.infoItemMid}>
              <Text style={styles.infoValue} numberOfLines={2}>
                {paciente?.procedimento?.hospital?.nome?.split(' ').slice(0, 2).join(' ') ?? '—'}
              </Text>
              <Text style={styles.infoLabel}>Hospital</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue} numberOfLines={2}>
                {medico?.user?.nome?.split(' ').slice(1, 2).join('') ?? '—'}
              </Text>
              <Text style={styles.infoLabel}>Médico</Text>
            </View>
          </View>
        )}

        {/* Lembrete */}
        {proc?.lembrete && (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderIcon}>◈</Text>
            <Text style={styles.reminderText}>{proc.lembrete}</Text>
          </View>
        )}

        {/* Journey */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etapas</Text>
          <View style={styles.jornadaList}>
            {jornada.sort((a, b) => a.ordem - b.ordem).map((etapa, i) => (
              <JornadaCard
                key={etapa.id}
                etapa={etapa}
                isLast={i === jornada.length - 1}
                onPress={() => setSelectedEtapa(etapa)}
              />
            ))}
          </View>
        </View>

        {/* Checklist preview */}
        {proximosChecklist.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximas Ações</Text>
            {proximosChecklist.map((c) => (
              <View key={c.id} style={styles.checkRow}>
                <View style={styles.checkBox} />
                <Text style={styles.checkText}>{c.texto}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Etapa Detail Modal */}
      <Modal
        visible={!!selectedEtapa}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEtapa(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedEtapa(null)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          {selectedEtapa && (
            <>
              <Text style={styles.sheetTitle}>{selectedEtapa.label}</Text>
              {selectedEtapa.data && <Text style={styles.sheetDate}>{selectedEtapa.data}</Text>}
              <Text style={styles.sheetBody}>
                {selectedEtapa.detalhe ?? 'Informações sobre esta etapa serão exibidas aqui quando disponíveis.'}
              </Text>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  clinicName: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.inkPale,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  greeting: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 36,
    color: colors.gold,
    lineHeight: 42,
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 2,
    padding: 20,
    marginBottom: 16,
  },
  cardLabel: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.inkPale,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pctNumber: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 52,
    color: colors.gold,
    lineHeight: 56,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.card2,
    borderRadius: 1,
    marginTop: 8,
    marginBottom: 6,
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 1,
  },
  progressSub: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 11,
    color: colors.inkPale,
  },
  infoGrid: {
    marginHorizontal: 24,
    flexDirection: 'row',
    backgroundColor: colors.card2,
    borderRadius: 2,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    padding: 16,
    gap: 4,
    alignItems: 'center',
  },
  infoItemMid: {
    flex: 1,
    padding: 16,
    gap: 4,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.card,
  },
  infoValue: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  infoLabel: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 9,
    color: colors.inkPale,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reminderCard: {
    marginHorizontal: 24,
    backgroundColor: colors.gold + '12',
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    borderRadius: 2,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  reminderIcon: { color: colors.gold, fontSize: 16, marginTop: 1 },
  reminderText: {
    fontFamily: 'Jost_300Light',
    fontSize: 13,
    color: colors.white,
    flex: 1,
    lineHeight: 20,
  },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.inkPale,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  jornadaList: { gap: 0 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkPale + '20',
  },
  checkBox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 2,
  },
  checkText: { fontFamily: 'Jost_300Light', fontSize: 13, color: colors.white, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: {
    backgroundColor: colors.inkDim,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 3,
    backgroundColor: colors.inkPale,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'CormorantGaramond_600Italic',
    fontSize: 24,
    color: colors.white,
    marginBottom: 6,
  },
  sheetDate: {
    fontFamily: 'Jost_300Light',
    fontSize: 12,
    color: colors.gold,
    marginBottom: 12,
  },
  sheetBody: {
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: colors.inkPale,
    lineHeight: 22,
  },
})
