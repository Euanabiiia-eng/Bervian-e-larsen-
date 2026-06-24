import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import colors from '../../constants/colors'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch {
      setError('E-mail ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>Ápice</Text>
          <Text style={styles.logoSub}>by Black Premium</Text>
          <Text style={styles.clinicName}>Bervian & Larsen</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor={colors.inkPale}
              placeholder="seu@email.com"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.inkPale}
              placeholder="••••••••"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Plataforma Ápice · Cirurgia Plástica Premium</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logo: {
    fontFamily: 'CormorantGaramond_400Italic',
    fontSize: 64,
    color: colors.gold,
    letterSpacing: 2,
    lineHeight: 70,
  },
  logoSub: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 13,
    color: colors.inkPale,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  clinicName: {
    fontFamily: 'Jost_300Light',
    fontSize: 11,
    color: colors.goldPale,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  form: {
    width: '100%',
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontFamily: 'Jost_300Light',
    fontSize: 10,
    color: colors.inkPale,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.inkPale,
    paddingVertical: 10,
    fontFamily: 'Jost_300Light',
    fontSize: 15,
    color: colors.white,
  },
  error: {
    fontFamily: 'Jost_300Light',
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    color: colors.white,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footer: {
    fontFamily: 'Jost_200ExtraLight',
    fontSize: 10,
    color: colors.inkPale,
    letterSpacing: 1,
    marginTop: 48,
    textAlign: 'center',
  },
})
