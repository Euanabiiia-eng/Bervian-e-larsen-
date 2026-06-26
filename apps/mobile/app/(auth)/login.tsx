import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin() {
    if (!email || !senha) return Alert.alert('', 'Preencha e-mail e senha')
    setLoading(true)
    try {
      const u = await login(email.trim().toLowerCase(), senha)
      const isAdmin = u.role === 'ADMIN' || u.role === 'MEDICO'
      router.replace(isAdmin ? '/(admin)' : '/(patient)')
    } catch {
      Alert.alert('Acesso negado', 'E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBorder}>
            <Text style={styles.logoChar}>Á</Text>
          </View>
          <Text style={styles.logoSub}>by Black Premium</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>E-MAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#6A6458"
              placeholder="seu@email.com.br"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SENHA</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!showPassword}
                placeholderTextColor="#6A6458"
                placeholder="••••••••"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Text style={{ color: '#6A6458', fontSize: 12 }}>{showPassword ? 'ocultar' : 'exibir'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#F7F2EA" />
            ) : (
              <Text style={styles.buttonText}>ENTRAR</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Clínica Bervian & Larsen · Porto Alegre/RS</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0D0C' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logoArea: { alignItems: 'center', marginBottom: 56 },
  logoBorder: {
    borderWidth: 1,
    borderColor: '#D4B87A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },
  logoChar: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 28,
    color: '#8B6914',
    letterSpacing: 6,
  },
  logoSub: {
    fontFamily: 'Jost_300Light',
    fontSize: 10,
    color: '#6A6458',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  form: { gap: 24 },
  field: { gap: 8 },
  label: {
    fontFamily: 'Jost_300Light',
    fontSize: 9,
    color: '#6A6458',
    letterSpacing: 3,
  },
  input: {
    fontFamily: 'Jost_300Light',
    fontSize: 14,
    color: '#F7F2EA',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2820',
    paddingBottom: 10,
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#8B6914',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontFamily: 'Jost_300Light',
    fontSize: 11,
    color: '#F7F2EA',
    letterSpacing: 4,
  },
  footer: {
    fontFamily: 'Jost_300Light',
    fontSize: 10,
    color: '#6A6458',
    textAlign: 'center',
    marginTop: 48,
    letterSpacing: 1,
  },
})
