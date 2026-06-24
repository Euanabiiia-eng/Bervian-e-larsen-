import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../hooks/useAuth'
import { usePatient } from '../../hooks/usePatient'
import colors from '../../constants/colors'

const statusLabels: Record<string, string> = {
  lead: 'Lead',
  pre_op: 'Pré-Operatório',
  pos_op: 'Pós-Operatório',
  alta: 'Alta',
}

const statusColors: Record<string, string> = {
  lead: colors.inkPale,
  pre_op: colors.gold,
  pos_op: colors.ok,
  alta: colors.goldPale,
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

export default function PerfilScreen() {
  const { logout } = useAuth()
  const { paciente } = usePatient()

  const nome = paciente?.user?.nome ?? '—'
  const status = paciente?.status ?? 'pre_op'
  const proc = paciente?.procedimento
  const medico = paciente?.medico
  const hospital = proc?.hospital

  const dataCirurgia = paciente?.dataCirurgia
    ? new Date(paciente.dataCirurgia).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nome}>{nome}</Text>
          <View style={[styles.statusBadge, { borderColor: statusColors[status] }]}>
            <Text style={[styles.statusText, { color: statusColors[status] }]}>
              {statusLabels[status] ?? status}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Cirúrgicas</Text>
          {proc && <InfoCard label="Procedimento" value={proc.nome} />}
          {proc && <InfoCard label="Categoria" value={proc.categoria} />}
          {medico && <InfoCard label="Médico Responsável" value={`${medico.user.nome} · CRM-RS ${medico.crm}`} />}
          <InfoCard label="Data da Cirurgia" value={dataCirurgia} />
          {paciente?.horaCirurgia && <InfoCard label="Horário" value={paciente.horaCirurgia} />}
          {hospital && (
            <>
              <InfoCard label="Hospital" value={hospital.nome} />
              {hospital.endereco && <InfoCard label="Endereço" value={hospital.endereco} />}
            </>
          )}
        </View>

        {/* Contact */}
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyIcon}>◈</Text>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyTitle}>Contato de Emergência</Text>
            <Text style={styles.emergencyBody}>
              Em caso de intercorrência, entre em contato diretamente com a clínica.
            </Text>
            {hospital?.telefone && (
              <Text style={styles.emergencyPhone}>{hospital.telefone}</Text>
            )}
          </View>
        </View>

        {/* Post-op note */}
        {status === 'pre_op' && (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              Após a cirurgia, seu acompanhamento pós-operatório continuará aqui no aplicativo. 🌿
            </Text>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.card2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gold + '15',
    borderWidth: 1.5,
    borderColor: colors.gold + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: 'CormorantGaramond_600Italic',
    fontSize: 28,
    color: colors.gold,
  },
  nome: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 28,
    color: colors.ink,
    marginBottom: 8,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'Jost_300Light',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.inkPale,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  infoCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.card2,
    gap: 2,
  },
  infoLabel: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.inkPale,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: colors.ink,
  },
  emergencyCard: {
    marginHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 4,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  emergencyIcon: {
    fontSize: 20,
    color: colors.gold,
    marginTop: 2,
  },
  emergencyInfo: { flex: 1, gap: 4 },
  emergencyTitle: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    color: colors.ink,
  },
  emergencyBody: {
    fontFamily: 'Jost_300Light',
    fontSize: 12,
    color: colors.inkPale,
    lineHeight: 18,
  },
  emergencyPhone: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    color: colors.gold,
    marginTop: 4,
  },
  noteCard: {
    marginHorizontal: 24,
    backgroundColor: colors.gold + '08',
    borderLeftWidth: 2,
    borderLeftColor: colors.gold + '60',
    padding: 14,
    borderRadius: 2,
    marginBottom: 24,
  },
  noteText: {
    fontFamily: 'Jost_300Light',
    fontSize: 13,
    color: colors.inkDim,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  logoutBtn: {
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 2,
  },
  logoutText: {
    fontFamily: 'Jost_300Light',
    fontSize: 13,
    color: colors.danger,
    letterSpacing: 1,
  },
})
