import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePatient } from '../../hooks/usePatient'
import { formatTime } from '@apice/utils'

export default function ChatScreen() {
  const { paciente, mensagens, loading, sendMensagem } = usePatient()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [mensagens])

  async function handleSend() {
    const msg = text.trim()
    if (!msg || sending) return
    setText('')
    setSending(true)
    setTyping(true)
    try {
      await sendMensagem(msg)
    } catch {}
    finally {
      setSending(false)
      setTyping(false)
    }
  }

  const visibleMensagens = mensagens.filter((m: any) => !m.pendienteAprovacao)

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>B</Text>
          </View>
          <View>
            <Text style={styles.headerName}>
              {paciente?.clinic?.nome ?? 'Clínica Método Black'}
            </Text>
            <Text style={styles.headerStatus}>IA + Equipe · 24h</Text>
          </View>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#8B6914" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, gap: 12 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {visibleMensagens.length === 0 && (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>
                  Olá! Envie uma mensagem e responderemos em instantes.
                </Text>
              </View>
            )}

            {visibleMensagens.map((msg: any, idx: number) => {
              const isPatient = msg.remetente === 'patient'
              return (
                <View
                  key={msg.id ?? idx}
                  style={[styles.bubbleWrap, isPatient ? styles.bubbleRight : styles.bubbleLeft]}
                >
                  <View style={[styles.bubble, isPatient ? styles.bubblePatient : styles.bubbleClinic]}>
                    <Text style={[styles.bubbleText, isPatient ? styles.bubbleTextPatient : styles.bubbleTextClinic]}>
                      {msg.conteudo}
                    </Text>
                  </View>
                  <Text style={[styles.time, isPatient ? { textAlign: 'right' } : {}]}>
                    {msg.remetente === 'ai' ? '🌿 IA · ' : ''}
                    {formatTime(msg.createdAt)}
                  </Text>
                </View>
              )
            })}

            {/* Typing indicator */}
            {typing && (
              <View style={styles.bubbleLeft}>
                <View style={styles.bubbleClinic}>
                  <View style={styles.typingDots}>
                    {[0, 1, 2].map((i) => (
                      <View key={i} style={styles.dot} />
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#6A6458"
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
          >
            {sending ? (
              <ActivityIndicator color="#F7F2EA" size="small" />
            ) : (
              <Text style={styles.sendIcon}>→</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0D0C' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2820',
  },
  avatar: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#D4B87A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontFamily: 'CormorantGaramond_400Regular_Italic', color: '#8B6914', fontSize: 16 },
  headerName: { fontFamily: 'Jost_400Regular', color: '#F7F2EA', fontSize: 13 },
  headerStatus: { fontFamily: 'Jost_300Light', color: '#8B6914', fontSize: 10, letterSpacing: 1 },
  emptyChat: { paddingVertical: 40, alignItems: 'center' },
  emptyChatText: { fontFamily: 'Jost_300Light', color: '#6A6458', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  bubbleWrap: { maxWidth: '80%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: { padding: 12, borderRadius: 2 },
  bubblePatient: { backgroundColor: '#2A2820' },
  bubbleClinic: { backgroundColor: '#EDE5D8' },
  bubbleText: { fontSize: 13, lineHeight: 20 },
  bubbleTextPatient: { fontFamily: 'Jost_300Light', color: '#F7F2EA' },
  bubbleTextClinic: { fontFamily: 'Jost_300Light', color: '#0E0D0C' },
  time: { fontFamily: 'Jost_200ExtraLight', fontSize: 9, color: '#6A6458', marginTop: 4, letterSpacing: 1 },
  typingDots: { flexDirection: 'row', gap: 4, padding: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B6914' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2820',
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Jost_300Light',
    color: '#F7F2EA',
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#2A2820',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 2,
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#8B6914',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  sendIcon: { color: '#F7F2EA', fontSize: 18, fontFamily: 'Jost_400Regular' },
})
