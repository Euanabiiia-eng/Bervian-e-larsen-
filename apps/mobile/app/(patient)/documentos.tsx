import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePatient } from '../../hooks/usePatient'

const statusConfig: Record<string, { label: string; color: string }> = {
  assinado: { label: 'Assinado', color: '#3D6B4F' },
  disponivel: { label: 'Disponível', color: '#8B6914' },
  pendente: { label: 'Em breve', color: '#6A6458' },
}

const categorias: Record<string, string[]> = {
  'Termos & Consentimento': ['consentimento', 'anestesia'],
  'Receitas': ['receita_pre', 'receita_pos'],
  'Orientações': ['orientacoes_pre', 'orientacoes_pos'],
  'Internação': ['internacao'],
  'Imagens': ['imagem'],
}

export default function DocumentosScreen() {
  const { documentos, loading } = usePatient()
  const [selectedDoc, setSelectedDoc] = useState<any>(null)

  function openDoc(doc: any) {
    if (doc.status === 'pendente') return
    setSelectedDoc(doc)
  }

  const grouped = Object.entries(categorias).map(([cat, tipos]) => ({
    cat,
    docs: documentos.filter((d: any) => tipos.includes(d.tipo)),
  })).filter((g) => g.docs.length > 0)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Documentos</Text>
        <Text style={styles.subtitle}>Termos, receitas e orientações</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#8B6914', fontFamily: 'Jost_300Light' }}>Carregando...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 24 }}>
          {grouped.map(({ cat, docs }) => (
            <View key={cat}>
              <Text style={styles.catLabel}>{cat.toUpperCase()}</Text>
              <View style={styles.docList}>
                {docs.map((doc: any) => {
                  const st = statusConfig[doc.status] ?? statusConfig.pendente
                  const locked = doc.status === 'pendente'
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      onPress={() => openDoc(doc)}
                      activeOpacity={locked ? 1 : 0.7}
                      style={[styles.docItem, locked && { opacity: 0.5 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docTitle}>{doc.titulo}</Text>
                        {doc.liberadoEm && locked && (
                          <Text style={styles.docSub}>Disponível após a cirurgia</Text>
                        )}
                      </View>
                      <View style={[styles.badge, { borderColor: st.color }]}>
                        <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Document viewer modal */}
      <Modal
        visible={!!selectedDoc}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDoc(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectedDoc?.titulo}</Text>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalContent}>
                {selectedDoc?.conteudo ?? 'Conteúdo não disponível.'}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedDoc(null)}
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
  title: { fontFamily: 'CormorantGaramond_400Regular_Italic', color: '#F7F2EA', fontSize: 26 },
  subtitle: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 11, marginTop: 2 },
  catLabel: {
    fontFamily: 'Jost_300Light',
    fontSize: 9,
    color: '#6A6458',
    letterSpacing: 3,
    marginBottom: 10,
  },
  docList: { gap: 1 },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2820',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  docTitle: { fontFamily: 'Jost_300Light', color: '#F7F2EA', fontSize: 13 },
  docSub: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 10, marginTop: 2 },
  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  badgeText: { fontFamily: 'Jost_300Light', fontSize: 9, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#EDE5D8',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: { width: 32, height: 3, backgroundColor: '#D4B87A', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'CormorantGaramond_400Regular_Italic', color: '#0E0D0C', fontSize: 20, marginBottom: 20 },
  modalContent: { fontFamily: 'Jost_300Light', color: '#2A2820', fontSize: 13, lineHeight: 22 },
  modalClose: { marginTop: 20, alignSelf: 'flex-start' },
  modalCloseText: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 10, letterSpacing: 3 },
})
