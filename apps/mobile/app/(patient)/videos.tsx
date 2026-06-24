import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Modal, TouchableOpacity, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePatient } from '../../hooks/usePatient'
import VideoCard from '../../components/VideoCard'
import colors from '../../constants/colors'
import type { ProcedimentoVideo } from '@apice/types'

export default function VideosScreen() {
  const { paciente, videos, refreshAll } = usePatient()
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<ProcedimentoVideo | null>(null)

  async function onRefresh() {
    setRefreshing(true)
    await refreshAll()
    setRefreshing(false)
  }

  const nome = paciente?.user?.nome?.split(' ')[0] ?? 'você'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vídeos</Text>
        </View>

        {/* Alert Card */}
        <View style={styles.alertCard}>
          <Text style={styles.alertText}>
            Preparado especialmente para você, <Text style={styles.alertName}>{nome}</Text>.
          </Text>
        </View>

        {/* Videos */}
        {videos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum vídeo disponível</Text>
            <Text style={styles.emptyBody}>Os vídeos educativos serão exibidos aqui quando disponíveis.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} onPress={() => setSelected(v)} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBg}>
          <View style={styles.videoModal}>
            <View style={styles.videoHeader}>
              <Text style={styles.videoTitle} numberOfLines={2}>{selected?.titulo}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            {selected?.descricao && (
              <Text style={styles.videoDesc}>{selected.descricao}</Text>
            )}

            {selected?.url && (
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => selected.url && Linking.openURL(selected.url)}
              >
                <Text style={styles.openBtnText}>▷  Abrir Vídeo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setSelected(null)} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 32,
    color: colors.white,
  },
  alertCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: colors.card2,
    borderRadius: 4,
    padding: 16,
  },
  alertText: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
  },
  alertName: {
    color: colors.gold,
    fontFamily: 'CormorantGaramond_600Italic',
  },
  list: { paddingTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 22,
    color: colors.white,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: 'Jost_300Light',
    fontSize: 13,
    color: colors.inkPale,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  videoModal: {
    backgroundColor: colors.inkDim,
    borderRadius: 8,
    padding: 24,
    gap: 16,
  },
  videoHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  videoTitle: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 22,
    color: colors.white,
    flex: 1,
    lineHeight: 28,
  },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 28, color: colors.inkPale, lineHeight: 28 },
  videoDesc: {
    fontFamily: 'Jost_300Light',
    fontSize: 13,
    color: colors.inkPale,
    lineHeight: 20,
  },
  openBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 2,
  },
  openBtnText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    color: colors.white,
    letterSpacing: 2,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissText: {
    fontFamily: 'Jost_300Light',
    fontSize: 12,
    color: colors.inkPale,
    letterSpacing: 1,
  },
})
