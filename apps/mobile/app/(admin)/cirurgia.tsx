import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../lib/api'

interface Option { id: string; nome: string; valor?: number }

function SelectField({
  label, value, onSelect, options, loading,
}: {
  label: string; value: Option | null
  onSelect: (o: Option) => void; options: Option[]; loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <View style={sf.field}>
        <Text style={sf.label}>{label}</Text>
        <TouchableOpacity style={sf.select} onPress={() => setOpen(true)}>
          {loading ? (
            <ActivityIndicator size="small" color="#8B6914" />
          ) : (
            <Text style={value ? sf.selectVal : sf.selectPh}>{value?.nome ?? 'Selecionar...'}</Text>
          )}
          <Text style={sf.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={sf.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={sf.sheet}>
            <View style={sf.handle} />
            <Text style={sf.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[sf.item, value?.id === item.id && sf.itemActive]}
                  onPress={() => { onSelect(item); setOpen(false) }}
                >
                  <Text style={[sf.itemText, value?.id === item.id && sf.itemTextActive]}>
                    {item.nome}
                  </Text>
                  {item.valor != null && (
                    <Text style={sf.itemVal}>R$ {item.valor.toLocaleString('pt-BR')}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

export default function CirurgiaScreen() {
  const [opts, setOpts] = useState({
    pacientes: [] as Option[], procedimentos: [] as Option[],
    medicos: [] as Option[], hospitais: [] as Option[],
  })
  const [loadingData, setLoadingData] = useState(true)

  const [paciente, setPaciente] = useState<Option | null>(null)
  const [procedimento, setProcedimento] = useState<Option | null>(null)
  const [medico, setMedico] = useState<Option | null>(null)
  const [hospital, setHospital] = useState<Option | null>(null)
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [valor, setValor] = useState('')
  const [obs, setObs] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/clinic/pacientes'),
      api.get('/clinic/procedimentos'),
      api.get('/clinic/medicos'),
      api.get('/clinic/hospitais'),
    ]).then(([p, pr, m, h]) => {
      setOpts({
        pacientes: (p.data.data ?? []).map((x: any) => ({ id: x.id, nome: x.user?.nome ?? x.nome ?? '—' })),
        procedimentos: (pr.data.data ?? []).map((x: any) => ({ id: x.id, nome: x.nome, valor: x.valor })),
        medicos: (m.data.data ?? []).map((x: any) => ({ id: x.id, nome: x.user?.nome ?? x.nome ?? '—' })),
        hospitais: (h.data.data ?? []).map((x: any) => ({ id: x.id, nome: x.nome })),
      })
    }).catch(console.error).finally(() => setLoadingData(false))
  }, [])

  async function submit() {
    if (!paciente || !procedimento || !medico || !hospital || !data || !hora) {
      return Alert.alert('', 'Preencha todos os campos obrigatórios')
    }
    const [d, m, y] = data.split('/')
    if (!y) return Alert.alert('', 'Data inválida — use DD/MM/AAAA')
    const isoDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T00:00:00.000Z`

    setSubmitting(true)
    try {
      await api.post('/clinic/cirurgias', {
        pacienteId: paciente.id,
        procedimentoId: procedimento.id,
        medicoId: medico.id,
        hospitalId: hospital.id,
        data: isoDate,
        horaInicio: hora,
        valor: valor ? parseFloat(valor.replace(',', '.')) : undefined,
        observacoes: obs || undefined,
        status: 'AGENDADA',
      })
      setSuccess(true)
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao agendar cirurgia')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setPaciente(null); setProcedimento(null); setMedico(null); setHospital(null)
    setData(''); setHora(''); setValor(''); setObs(''); setSuccess(false)
  }

  if (success) {
    return (
      <SafeAreaView style={[s.safe, s.successSafe]}>
        <Text style={s.successIcon}>✦</Text>
        <Text style={s.successTitle}>Cirurgia Agendada</Text>
        <Text style={s.successProc}>{procedimento?.nome}</Text>
        <Text style={s.successPat}>{paciente?.nome}</Text>
        <Text style={s.successDate}>{data} · {hora}</Text>
        <TouchableOpacity style={s.successBtn} onPress={reset}>
          <Text style={s.successBtnText}>+ AGENDAR OUTRA</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Nova Cirurgia</Text>
          <Text style={s.headerSub}>AGENDAMENTO</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <View style={s.section}>
            <Text style={s.sectionLabel}>PACIENTE & PROCEDIMENTO</Text>
            <SelectField label="Paciente *" value={paciente} onSelect={setPaciente} options={opts.pacientes} loading={loadingData} />
            <SelectField label="Procedimento *" value={procedimento} onSelect={setProcedimento} options={opts.procedimentos} loading={loadingData} />
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>EQUIPE & LOCAL</Text>
            <SelectField label="Médico Responsável *" value={medico} onSelect={setMedico} options={opts.medicos} loading={loadingData} />
            <SelectField label="Hospital / Clínica *" value={hospital} onSelect={setHospital} options={opts.hospitais} loading={loadingData} />
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>DATA & HORÁRIO</Text>
            <View style={sf.field}>
              <Text style={sf.label}>DATA * (DD/MM/AAAA)</Text>
              <TextInput
                style={sf.input}
                value={data}
                onChangeText={setData}
                placeholder="01/07/2026"
                placeholderTextColor="#6A6458"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <View style={sf.field}>
              <Text style={sf.label}>HORA DE INÍCIO *</Text>
              <TextInput
                style={sf.input}
                value={hora}
                onChangeText={setHora}
                placeholder="08:00"
                placeholderTextColor="#6A6458"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>FINANCEIRO & NOTAS</Text>
            <View style={sf.field}>
              <Text style={sf.label}>VALOR (R$)</Text>
              <TextInput
                style={sf.input}
                value={valor}
                onChangeText={setValor}
                placeholder="0,00"
                placeholderTextColor="#6A6458"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={sf.field}>
              <Text style={sf.label}>OBSERVAÇÕES</Text>
              <TextInput
                style={[sf.input, { height: 80, textAlignVertical: 'top', paddingTop: 8 }]}
                value={obs}
                onChangeText={setObs}
                placeholder="Notas adicionais..."
                placeholderTextColor="#6A6458"
                multiline
              />
            </View>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#0E0D0C" />
              : <Text style={s.submitBtnText}>✦  AGENDAR CIRURGIA</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const sf = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 2.5, marginBottom: 10 },
  select: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#2A2820', paddingBottom: 12,
  },
  selectVal: { fontFamily: 'Jost_300Light', fontSize: 14, color: '#F7F2EA', flex: 1 },
  selectPh: { fontFamily: 'Jost_300Light', fontSize: 14, color: '#4A4440', flex: 1 },
  arrow: { fontFamily: 'Jost_300Light', fontSize: 20, color: '#6A6458', marginLeft: 8 },
  input: {
    fontFamily: 'Jost_300Light', fontSize: 14, color: '#F7F2EA',
    borderBottomWidth: 1, borderBottomColor: '#2A2820', paddingBottom: 12,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1A1918', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingBottom: 40, maxHeight: '70%',
  },
  handle: { width: 40, height: 3, backgroundColor: '#2A2820', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetTitle: {
    fontFamily: 'Jost_200ExtraLight', fontSize: 9, color: '#6A6458',
    letterSpacing: 3, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2A2820',
  },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E1D1B' },
  itemActive: { backgroundColor: '#2A2820' },
  itemText: { fontFamily: 'Jost_300Light', fontSize: 14, color: '#F7F2EA', flex: 1 },
  itemTextActive: { color: '#D4B87A' },
  itemVal: { fontFamily: 'Jost_200ExtraLight', fontSize: 11, color: '#8B6914', marginLeft: 12 },
})

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0D0C' },
  successSafe: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  successIcon: { fontSize: 48, color: '#8B6914', marginBottom: 24 },
  successTitle: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 32, color: '#D4B87A', marginBottom: 16 },
  successProc: { fontFamily: 'Jost_400Regular', fontSize: 14, color: '#F7F2EA', marginBottom: 4 },
  successPat: { fontFamily: 'Jost_300Light', fontSize: 13, color: '#6A6458', marginBottom: 8 },
  successDate: { fontFamily: 'Jost_200ExtraLight', fontSize: 11, color: '#8B6914', letterSpacing: 2, marginBottom: 40 },
  successBtn: { backgroundColor: '#8B6914', paddingVertical: 14, paddingHorizontal: 40 },
  successBtnText: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#0E0D0C', letterSpacing: 3 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#1A1918', borderBottomWidth: 1, borderBottomColor: '#2A2820',
  },
  headerTitle: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 26, color: '#D4B87A' },
  headerSub: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#6A6458', letterSpacing: 2.5, marginTop: 2 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionLabel: { fontFamily: 'Jost_200ExtraLight', fontSize: 8, color: '#8B6914', letterSpacing: 3, marginBottom: 20 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0E0D0C', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#2A2820' },
  submitBtn: { backgroundColor: '#8B6914', paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { fontFamily: 'Jost_300Light', fontSize: 10, color: '#0E0D0C', letterSpacing: 3 },
})
