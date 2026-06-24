import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Plataforma Ápice by Black Premium',
  description: 'Eleve. Estruture. Lidere.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#EDE5D8',
              color: '#0E0D0C',
              border: '1px solid #D4B87A',
              fontFamily: 'Jost, system-ui, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
