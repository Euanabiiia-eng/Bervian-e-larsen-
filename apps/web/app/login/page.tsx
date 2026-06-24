'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`,
        { email: data.email, password: data.password }
      )

      const { accessToken, refreshToken } = res.data

      // Access token: 15 minutes
      Cookies.set('accessToken', accessToken, {
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        sameSite: 'Strict',
      })

      // Refresh token: 7 days
      Cookies.set('refreshToken', refreshToken, {
        expires: 7,
        sameSite: 'Strict',
      })

      router.push('/dashboard')
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Credenciais inválidas. Tente novamente.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-cream px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-cormorant italic text-6xl text-gold leading-none tracking-wide">
            Ápice
          </h1>
          <p className="font-jost font-[200] text-ink-pale text-sm tracking-[0.3em] uppercase mt-2">
            by Black Premium
          </p>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-gold mx-auto mb-10" />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-jost font-[300] text-xs tracking-widest uppercase text-ink-pale mb-2"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="input-field"
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-danger text-xs font-jost">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-jost font-[300] text-xs tracking-widest uppercase text-ink-pale mb-2"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="input-field"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-danger text-xs font-jost">{errors.password.message}</p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 px-4 py-3">
              <p className="text-danger text-sm font-jost font-[300]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-gold flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white-cream"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-center text-ink-pale text-xs font-jost font-[200] mt-10 tracking-wider">
          Plataforma restrita — acesso autorizado
        </p>
      </div>
    </div>
  )
}
