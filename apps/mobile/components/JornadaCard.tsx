import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { JornadaEtapa } from '@apice/types'
import colors from '../constants/colors'

interface JornadaCardProps {
  etapa: JornadaEtapa
  isLast: boolean
  onPress: () => void
}

export default function JornadaCard({ etapa, isLast, onPress }: JornadaCardProps) {
  const isDone = etapa.status === 'done'
  const isActive = etapa.status === 'active'

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      {/* Line */}
      <View style={styles.lineCol}>
        <View style={[styles.dot, isDone && styles.dotDone, isActive && styles.dotActive]} >
          <Text style={[styles.dotText, isDone && styles.dotTextDone]}>
            {isDone ? '✓' : isActive ? '→' : '·'}
          </Text>
        </View>
        {!isLast && <View style={[styles.line, isDone && styles.lineDone]} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.label, isDone && styles.labelDone, isActive && styles.labelActive]}>
          {etapa.label}
        </Text>
        {etapa.data ? (
          <Text style={styles.date}>{etapa.data}</Text>
        ) : null}
        {isActive ? (
          <Text style={styles.activeHint}>Em andamento · toque para detalhes</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  lineCol: {
    alignItems: 'center',
    width: 24,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.inkPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.ok,
    borderColor: colors.ok,
  },
  dotActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold + '20',
  },
  dotText: {
    fontSize: 10,
    color: colors.inkPale,
  },
  dotTextDone: {
    color: colors.white,
  },
  line: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.inkPale + '40',
    marginVertical: 2,
    minHeight: 20,
  },
  lineDone: {
    backgroundColor: colors.ok + '60',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
    gap: 2,
  },
  label: {
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: colors.inkPale,
  },
  labelDone: {
    color: colors.white,
    fontFamily: 'Jost_400Regular',
  },
  labelActive: {
    color: colors.gold,
    fontFamily: 'Jost_400Regular',
  },
  date: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 11,
    color: colors.inkPale,
  },
  activeHint: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.goldPale,
    letterSpacing: 0.5,
  },
})
