import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import type { Documento } from '@apice/types'
import colors from '../constants/colors'

interface DocumentoItemProps {
  documento: Documento
  onPress: () => void
}

const statusConfig = {
  assinado: { label: 'Assinado', color: colors.ok, bg: colors.ok + '15' },
  disponivel: { label: 'Disponível', color: colors.gold, bg: colors.gold + '15' },
  pendente: { label: 'Em breve', color: colors.inkPale, bg: colors.inkPale + '15' },
}

export default function DocumentoItem({ documento, onPress }: DocumentoItemProps) {
  const st = statusConfig[documento.status as keyof typeof statusConfig] ?? statusConfig.pendente
  const isPendente = documento.status === 'pendente'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={isPendente ? 0.5 : 0.75}
      style={[styles.container, isPendente && styles.containerLocked]}
    >
      <View style={styles.iconArea}>
        <Text style={[styles.icon, isPendente && styles.iconLocked]}>
          {isPendente ? '🔒' : '◻'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, isPendente && styles.titleLocked]}>{documento.titulo}</Text>
        {documento.liberadoEm && isPendente ? (
          <Text style={styles.date}>
            Disponível em {new Date(documento.liberadoEm).toLocaleDateString('pt-BR')}
          </Text>
        ) : documento.createdAt ? (
          <Text style={styles.date}>
            {new Date(documento.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        ) : null}
      </View>
      <View style={[styles.badge, { backgroundColor: st.bg }]}>
        <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.card + '40',
    gap: 12,
  },
  containerLocked: { opacity: 0.6 },
  iconArea: {
    width: 32,
    alignItems: 'center',
  },
  icon: { fontSize: 18, color: colors.gold },
  iconLocked: { color: colors.inkPale },
  info: { flex: 1, gap: 3 },
  title: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    color: colors.ink,
  },
  titleLocked: { color: colors.inkPale },
  date: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 11,
    color: colors.inkPale,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  badgeText: {
    fontFamily: 'Jost_300Light',
    fontSize: 10,
    letterSpacing: 0.5,
  },
})
