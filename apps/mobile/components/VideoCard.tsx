import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import type { ProcedimentoVideo } from '@apice/types'
import colors from '../constants/colors'

interface VideoCardProps {
  video: ProcedimentoVideo
  onPress: () => void
}

export default function VideoCard({ video, onPress }: VideoCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      {/* Thumbnail */}
      <View style={styles.thumb}>
        <View style={styles.playBtn}>
          <Text style={styles.playIcon}>▷</Text>
        </View>
      </View>
      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{video.titulo}</Text>
        {video.descricao && (
          <Text style={styles.desc} numberOfLines={2}>{video.descricao}</Text>
        )}
        <View style={styles.footer}>
          {video.duracao && (
            <View style={styles.durBadge}>
              <Text style={styles.durText}>{video.duracao}</Text>
            </View>
          )}
          <Text style={styles.watchBtn}>Assistir</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.inkDim,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  thumb: {
    height: 140,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 22,
    color: colors.gold,
    marginLeft: 4,
  },
  info: {
    padding: 16,
    gap: 6,
  },
  title: {
    fontFamily: 'Jost_500Medium',
    fontSize: 14,
    color: colors.white,
    lineHeight: 20,
  },
  desc: {
    fontFamily: 'Jost_300Light',
    fontSize: 12,
    color: colors.inkPale,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  durBadge: {
    borderWidth: 1,
    borderColor: colors.gold + '50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  durText: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.goldPale,
    letterSpacing: 1,
  },
  watchBtn: {
    fontFamily: 'Jost_300Light',
    fontSize: 12,
    color: colors.gold,
    letterSpacing: 1,
  },
})
