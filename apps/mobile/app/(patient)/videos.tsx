import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePatient } from '../../hooks/usePatient'

export default function VideosScreen() {
  const { paciente, videos, loading } = usePatient()
  const [selectedVideo, setSelectedVideo] = useState<any>(null)

  async function openVideo(url?: string) {
    if (!url) return
    try {
      await Linking.openURL(url)
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Vídeos</Text>
        <Text style={styles.subtitle}>Preparados especialmente para você</Text>
        {paciente?.user?.nome && (
          <Text style={styles.subtitleName}>{paciente.user.nome.split(' ')[0]}</Text>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#8B6914', fontFamily: 'Jost_300Light' }}>Carregando...</Text>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>▷</Text>
          <Text style={styles.emptyLabel}>Nenhum vídeo disponível ainda</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, gap: 16 }}
        >
          {videos.map((v: any) => (
            <TouchableOpacity
              key={v.id}
              style={styles.videoCard}
              onPress={() => setSelectedVideo(v)}
              activeOpacity={0.8}
            >
              {/* Thumbnail */}
              <View style={styles.thumbnail}>
                <View style={styles.playButton}>
                  <Text style={styles.playIcon}>▷</Text>
                </View>
              </View>

              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{v.titulo}</Text>
                {v.descricao && (
                  <Text style={styles.videoDesc} numberOfLines={2}>{v.descricao}</Text>
                )}
                {v.duracao && (
                  <Text style={styles.videoDuracao}>{v.duracao}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Video detail modal */}
      <Modal
        visible={!!selectedVideo}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Large thumbnail */}
            <View style={styles.modalThumbnail}>
              <View style={styles.modalPlayBtn}>
                <Text style={styles.modalPlayIcon}>▷</Text>
              </View>
            </View>

            <Text style={styles.modalTitle}>{selectedVideo?.titulo}</Text>
            {selectedVideo?.duracao && (
              <Text style={styles.modalDuracao}>{selectedVideo.duracao}</Text>
            )}
            {selectedVideo?.descricao && (
              <Text style={styles.modalDesc}>{selectedVideo.descricao}</Text>
            )}

            <View style={styles.modalActions}>
              {selectedVideo?.url && (
                <TouchableOpacity
                  style={styles.watchBtn}
                  onPress={() => openVideo(selectedVideo.url)}
                >
                  <Text style={styles.watchBtnText}>ASSISTIR AGORA</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setSelectedVideo(null)}>
                <Text style={styles.closeText}>FECHAR</Text>
              </TouchableOpacity>
            </View>
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
  subtitleName: { fontFamily: 'CormorantGaramond_400Regular_Italic', color: '#8B6914', fontSize: 15, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 32, color: '#2A2820' },
  emptyLabel: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 13 },
  videoCard: { backgroundColor: '#2A2820', overflow: 'hidden' },
  thumbnail: {
    height: 180,
    backgroundColor: '#1A1918',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#8B6914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { fontSize: 20, color: '#8B6914', marginLeft: 3 },
  videoInfo: { padding: 16 },
  videoTitle: { fontFamily: 'Jost_400Regular', color: '#F7F2EA', fontSize: 14 },
  videoDesc: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 12, marginTop: 6, lineHeight: 18 },
  videoDuracao: { fontFamily: 'Jost_300Light', color: '#8B6914', fontSize: 11, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0E0D0C',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#2A2820',
  },
  modalHandle: { width: 32, height: 3, backgroundColor: '#2A2820', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalThumbnail: {
    height: 200,
    backgroundColor: '#1A1918',
    borderRadius: 4,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#8B6914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlayIcon: { fontSize: 28, color: '#8B6914', marginLeft: 4 },
  modalTitle: { fontFamily: 'CormorantGaramond_400Regular_Italic', color: '#F7F2EA', fontSize: 20 },
  modalDuracao: { fontFamily: 'Jost_300Light', color: '#8B6914', fontSize: 12, marginTop: 4 },
  modalDesc: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 13, lineHeight: 20, marginTop: 12 },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 24 },
  watchBtn: { backgroundColor: '#8B6914', paddingHorizontal: 20, paddingVertical: 12 },
  watchBtnText: { fontFamily: 'Jost_300Light', color: '#F7F2EA', fontSize: 10, letterSpacing: 3 },
  closeText: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 10, letterSpacing: 3 },
})
