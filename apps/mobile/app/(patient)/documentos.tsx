import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Modal, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePatient } from '../../hooks/usePatient'
import DocumentoItem from '../../components/DocumentoItem'
import colors from '../../constants/colors'
import type { Documento } from '@apice/types'

const GRUPOS: Record<string, string[]> = {
  'Termos': ['consentimento', 'anestesia'],
  'Orientações': ['orientacoes_pre', 'orientacoes_pos'],
  'Receitas': ['receita_pre', 'receita_pos'],
  'Internação': ['internacao'],
  'Imagens': ['imagem'],
}

export default function DocumentosScreen() {
  const { documentos, refreshAll } = usePatient()
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<Documento | null>(null)

  async function onRefresh() {
    setRefreshing(true)
    await refreshAll()
    setRefreshing(false)
  }

  function handlePress(doc: Documento) {
    if (doc.status === 'pendente') return
    setSelected(doc)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Documentos</Text>
          <Text style={styles.subtitle}>{documentos.length} documentos</Text>
        </View>

        {/* Groups */}
        {Object.entries(GRUPOS).map(([grupo, tipos]) => {
          const docs = documentos.filter((d) => tipos.includes(d.tipo))
          if (docs.length === 0) return null
          return (
            <View key={grupo} style={styles.group}>
              <Text style={styles.groupTitle}>{grupo}</Text>
              <View style={styles.groupCard}>
                {docs.map((doc) => (
                  <DocumentoItem
                    key={doc.id}
                    documento={doc}
                    onPress={() => handlePress(doc)}
                  />
                ))}
              </View>
            </View>
          )
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Document Detail Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setSelected(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {selected && (
            <>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{selected.titulo}</Text>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Text style={styles.sheetClose}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                {selected.conteudo ? (
                  <Text style={styles.sheetContent}>{selected.conteudo}</Text>
                ) : selected.urlArquivo ? (
                  <View style={styles.filePrompt}>
                    <Text style={styles.filePromptText}>Este documento está disponível como arquivo.</Text>
                    <Text style={styles.fileUrl}>{selected.urlArquivo}</Text>
                  </View>
                ) : (
                  <Text style={styles.sheetContent}>Conteúdo não disponível.</Text>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 32,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 11,
    color: colors.inkPale,
    marginTop: 4,
  },
  group: { marginBottom: 24 },
  groupTitle: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 18,
    color: colors.ink,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  groupCard: {
    backgroundColor: colors.card,
    marginHorizontal: 24,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(14,13,12,0.5)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36, height: 3,
    backgroundColor: colors.card2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 22,
    color: colors.ink,
    flex: 1,
    paddingRight: 12,
  },
  sheetClose: { fontSize: 24, color: colors.inkPale, lineHeight: 28 },
  sheetScroll: { maxHeight: 400 },
  sheetContent: {
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: colors.inkDim,
    lineHeight: 24,
  },
  filePrompt: { gap: 8 },
  filePromptText: {
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: colors.inkPale,
  },
  fileUrl: {
    fontFamily: 'Jost_300Light',
    fontSize: 12,
    color: colors.gold,
  },
})
