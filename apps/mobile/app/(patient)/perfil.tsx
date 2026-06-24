import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { usePatient } from '../../hooks/usePatient'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '@apice/utils'

export default function PerfilScreen() {
  const { paciente, checklist } = usePatient()
  const { logout } = useAuth()
  const router = useRouter()

  const checklistFeito = checklist.filter((c: any) => c.feito).length
  const checklistTotal = checklist.length

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  if (!paciente) return null

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {paciente.user.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.name}>{paciente.user.nome}</Text>
          <Text style={styles.email}>{paciente.user.email}</Text>
        </View>

        {/* Info cards */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MINHA CIRURGIA</Text>
          <View style={styles.card}>
            {[
              { label: 'Procedimento', value: paciente.procedimento?.nome },
              { label: 'Médico', value: paciente.medico?.user?.nome },
              { label: 'Data', value: paciente.dataCirurgia ? formatDate(paciente.dataCirurgia) : null },
              { label: 'Horário', value: paciente.horaCirurgia ? `${paciente.horaCirurgia}h` : null },
              { label: 'Hospital', value: paciente.procedimento?.hospital?.nome },
            ].filter((r) => r.value).map(({ label, value }) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Checklist progress */}
        {checklistTotal > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CHECKLIST</Text>
            <View style={styles.card}>
              <View style={styles.checkRow}>
                <Text style={styles.checkText}>
                  {checklistFeito} de {checklistTotal} itens concluídos
                </Text>
                <Text style={styles.checkPct}>
                  {Math.round((checklistFeito / checklistTotal) * 100)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round((checklistFeito / checklistTotal) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Clinic contact */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTATO DA CLÍNICA</Text>
          <View style={styles.card}>
            <Text style={styles.clinicName}>{paciente.clinic?.nome}</Text>
            <Text style={styles.clinicInfo}>Para dúvidas urgentes, entre em contato diretamente com nossa equipe pelo canal oficial.</Text>
          </View>
        </View>

        {/* Post-op notice */}
        {paciente.status === 'pre_op' && (
          <View style={styles.section}>
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Pós-operatório</Text>
              <Text style={styles.noticeText}>
                Após sua cirurgia, documentos e orientações pós-operatórias serão liberados automaticamente. Seu acompanhamento continuará pelo aplicativo.
              </Text>
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>SAIR DO APLICATIVO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0D0C' },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2820',
  },
  avatar: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: '#D4B87A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontFamily: 'CormorantGaramond_400Regular', color: '#8B6914', fontSize: 22 },
  name: { fontFamily: 'CormorantGaramond_400Regular', color: '#F7F2EA', fontSize: 22 },
  email: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 11, marginTop: 4 },
  section: { paddingHorizontal: 24, paddingTop: 24 },
  sectionLabel: { fontFamily: 'Jost_300Light', fontSize: 9, color: '#6A6458', letterSpacing: 3, marginBottom: 12 },
  card: { backgroundColor: '#2A2820', padding: 16, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 11 },
  infoValue: { fontFamily: 'Jost_400Regular', color: '#F7F2EA', fontSize: 12, maxWidth: '60%', textAlign: 'right' },
  checkRow: { flexDirection: 'row', justifyContent: 'space-between' },
  checkText: { fontFamily: 'Jost_300Light', color: '#F7F2EA', fontSize: 12 },
  checkPct: { fontFamily: 'Jost_400Regular', color: '#8B6914', fontSize: 14 },
  progressTrack: { height: 2, backgroundColor: '#0E0D0C', borderRadius: 1, marginTop: 8 },
  progressFill: { height: 2, backgroundColor: '#8B6914', borderRadius: 1 },
  clinicName: { fontFamily: 'Jost_400Regular', color: '#F7F2EA', fontSize: 13 },
  clinicInfo: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 12, lineHeight: 18 },
  noticeCard: { backgroundColor: '#1A1918', borderLeftWidth: 2, borderLeftColor: '#8B6914', padding: 16 },
  noticeTitle: { fontFamily: 'Jost_400Regular', color: '#D4B87A', fontSize: 12, marginBottom: 8 },
  noticeText: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 12, lineHeight: 18 },
  logoutBtn: { borderWidth: 1, borderColor: '#2A2820', padding: 14, alignItems: 'center' },
  logoutText: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 10, letterSpacing: 3 },
})
