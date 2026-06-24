import { View, Text, StyleSheet } from 'react-native'
import type { Mensagem } from '@apice/types'
import colors from '../constants/colors'

interface ChatBubbleProps {
  mensagem: Mensagem
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble({ mensagem }: ChatBubbleProps) {
  const isPatient = mensagem.remetente === 'patient'

  return (
    <View style={[styles.row, isPatient && styles.rowRight]}>
      <View style={[styles.bubble, isPatient ? styles.bubblePatient : styles.bubbleClinic]}>
        {mensagem.pendienteAprovacao ? (
          <Text style={styles.pending}>⏳ Aguardando revisão da equipe...</Text>
        ) : (
          <Text style={[styles.text, isPatient && styles.textPatient]}>
            {mensagem.conteudo}
          </Text>
        )}
        <Text style={[styles.time, isPatient && styles.timePatient]}>
          {formatTime(mensagem.createdAt)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    alignItems: 'flex-start',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    gap: 4,
  },
  bubbleClinic: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bubblePatient: {
    backgroundColor: colors.gold,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  text: {
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: colors.ink,
    lineHeight: 21,
  },
  textPatient: {
    color: colors.white,
  },
  pending: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 12,
    color: colors.inkPale,
    fontStyle: 'italic',
  },
  time: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.inkPale,
    alignSelf: 'flex-end',
  },
  timePatient: {
    color: colors.white + 'AA',
  },
})
