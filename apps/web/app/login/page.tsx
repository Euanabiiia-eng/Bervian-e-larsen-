'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { login } from '@/lib/auth'
import { Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await login(data.email, data.senha)
      router.replace('/dashboard')
    } catch {
      toast.error('E-mail ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-12">
          <div className="inline-block border border-gold-pale px-6 py-3 mb-6">
            <span className="font-serif text-2xl italic text-gold tracking-widest">ÁPICE</span>
          </div>
          <p className="text-ink-pale text-sm tracking-[0.2em] uppercase font-light">
            by Black Premium
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-pale mb-2 font-light">
              E-mail
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="w-full bg-transparent border-b border-card2 py-2.5 text-ink text-sm outline-none focus:border-gold transition-colors placeholder:text-ink-pale/40"
              placeholder="seu@email.com.br"
            />
            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-pale mb-2 font-light">
              Senha
            </label>
            <div className="relative">
              <input
                {...register('senha')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full bg-transparent border-b border-card2 py-2.5 pr-10 text-ink text-sm outline-none focus:border-gold transition-colors placeholder:text-ink-pale/40"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-pale hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.senha && (
              <p className="text-danger text-xs mt-1">{errors.senha.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-gold text-white py-3 text-sm tracking-widest uppercase font-light hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-ink-pale text-xs mt-8 font-light">
          Clínica Bervian & Larsen · Porto Alegre/RS
        </p>
      </div>
    </div>
  )
}
