import { useState, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../constants/api'
import { usePatient } from '../../hooks/usePatient'
import ChatBubble from '../../components/ChatBubble'
import colors from '../../constants/colors'
import type { Mensagem } from '@apice/types'

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current
  const dot2 = useRef(new Animated.Value(0.3)).current
  const dot3 = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      )
    const a1 = pulse(dot1, 0)
    const a2 = pulse(dot2, 200)
    const a3 = pulse(dot3, 400)
    a1.start(); a2.start(); a3.start()
    return () => { a1.stop(); a2.stop(); a3.stop() }
  }, [])

  return (
    <View style={typingStyles.container}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[typingStyles.dot, { opacity: dot }]} />
      ))}
    </View>
  )
}

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.goldPale,
  },
})

export default function ChatScreen() {
  const { paciente, mensagens, refreshAll } = usePatient()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [localMessages, setLocalMessages] = useState<Mensagem[]>([])
  const [showBanner, setShowBanner] = useState(false)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    setLocalMessages(mensagens)
  }, [mensagens])

  async function sendMessage() {
    const text = input.trim()
    if (!text) return
    setInput('')

    const tempPatientMsg: Mensagem = {
      id: `temp-${Date.now()}`,
      pacienteId: paciente?.id ?? '',
      clinicId: paciente?.clinicId ?? '',
      remetente: 'patient',
      conteudo: text,
      tipo: 'manual',
      pendienteAprovacao: false,
      createdAt: new Date().toISOString(),
    }

    setLocalMessages((prev) => [...prev, tempPatientMsg])
    setIsTyping(true)

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const res = await api.post<{ data: { resposta: Mensagem } }>('/patient/mensagens', {
        conteudo: text,
      })
      const resposta = res.data?.data?.resposta
      setIsTyping(false)
      if (resposta) {
        setLocalMessages((prev) => [...prev, resposta])
        if (resposta.pendienteAprovacao) setShowBanner(true)
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
      await refreshAll()
    } catch {
      setIsTyping(false)
      const errorMsg: Mensagem = {
        id: `err-${Date.now()}`,
        pacienteId: paciente?.id ?? '',
        clinicId: paciente?.clinicId ?? '',
        remetente: 'ai',
        conteudo: 'Não foi possível processar sua mensagem. Tente novamente. 🌿',
        tipo: 'auto',
        pendienteAprovacao: false,
        createdAt: new Date().toISOString(),
      }
      setLocalMessages((prev) => [...prev, errorMsg])
    }
  }

  const clinicNome = paciente?.clinic?.nome ?? 'Clínica'
  const initials = clinicNome.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>Assistente Ápice</Text>
            <Text style={styles.headerSub}>IA + Equipe · 24h</Text>
          </View>
        </View>

        {/* Approval banner */}
        {showBanner && (
          <TouchableOpacity onPress={() => setShowBanner(false)} style={styles.banner}>
            <Text style={styles.bannerText}>
              Encaminhado para nossa equipe — retornaremos em breve 🌿
            </Text>
          </TouchableOpacity>
        )}

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={localMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble mensagem={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Olá! 🌿</Text>
              <Text style={styles.emptyBody}>
                Sou a assistente da {clinicNome}. Como posso ajudá-la hoje?
              </Text>
            </View>
          }
          ListFooterComponent={isTyping ? <TypingDots /> : null}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.inkPale}
            multiline
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim()}
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.inkDim },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gold + '20',
    borderWidth: 1,
    borderColor: colors.gold + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 16,
    color: colors.gold,
  },
  headerInfo: { gap: 1 },
  headerName: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    color: colors.white,
  },
  headerSub: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.inkPale,
    letterSpacing: 1,
  },
  banner: {
    backgroundColor: colors.gold + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold + '30',
  },
  bannerText: {
    fontFamily: 'Jost_300Light',
    fontSize: 12,
    color: colors.goldPale,
    textAlign: 'center',
  },
  listContent: { paddingVertical: 12 },
  empty: { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 26,
    color: colors.white,
  },
  emptyBody: {
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: colors.inkPale,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ink,
    backgroundColor: colors.ink,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inkDim,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: colors.white,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.gold + '40',
  },
  sendIcon: {
    fontSize: 18,
    color: colors.white,
  },
})
