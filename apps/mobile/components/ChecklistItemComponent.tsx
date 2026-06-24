import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native'
import { useRef } from 'react'
import type { ChecklistItem } from '@apice/types'
import colors from '../constants/colors'

interface ChecklistItemProps {
  item: ChecklistItem
  onToggle: (id: string) => void
}

export default function ChecklistItemComponent({ item, onToggle }: ChecklistItemProps) {
  const scale = useRef(new Animated.Value(1)).current

  function handleToggle() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start()
    onToggle(item.id)
  }

  return (
    <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={styles.row}>
      <Animated.View style={[styles.checkbox, item.feito && styles.checkboxDone, { transform: [{ scale }] }]}>
        {item.feito && <Text style={styles.checkmark}>✓</Text>}
      </Animated.View>
      <Text style={[styles.text, item.feito && styles.textDone]}>{item.texto}</Text>
      <View style={[styles.janela, janelaColor(item.janela)]}>
        <Text style={styles.janelaText}>{item.janela}</Text>
      </View>
    </TouchableOpacity>
  )
}

function janelaColor(janela: string): object {
  if (janela === 'T2') return { backgroundColor: colors.danger + '20' }
  if (janela === 'T24') return { backgroundColor: colors.gold + '20' }
  if (janela === 'T72') return { backgroundColor: colors.ok + '15' }
  return { backgroundColor: colors.inkPale + '15' }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkPale + '20',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: colors.ok,
    borderColor: colors.ok,
  },
  checkmark: {
    fontSize: 11,
    color: colors.white,
    fontWeight: 'bold',
  },
  text: {
    fontFamily: 'Jost_300Light',
    fontSize: 13,
    color: colors.white,
    flex: 1,
    lineHeight: 20,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: colors.inkPale,
  },
  janela: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  janelaText: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 9,
    color: colors.white,
    letterSpacing: 0.5,
  },
})
