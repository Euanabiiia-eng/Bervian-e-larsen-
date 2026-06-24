'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, logout } from '@/lib/auth'
import {
  LayoutDashboard,
  Kanban,
  Scissors,
  Users,
  MessageSquare,
  BookOpen,
  Building2,
  UserCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/cirurgias', label: 'Cirurgias', icon: Scissors },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/mensagens', label: 'Mensagens', icon: MessageSquare },
  { href: '/procedimentos', label: 'Procedimentos', icon: BookOpen },
  { href: '/hospitais', label: 'Hospitais', icon: Building2 },
  { href: '/medicos', label: 'Médicos', icon: UserCheck },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login')
  }, [router])

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-56 bg-ink flex flex-col z-30 transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="px-6 py-7 border-b border-ink-dim">
          <div className="flex items-center gap-3">
            <div className="border border-gold-pale px-2 py-1">
              <span className="font-serif italic text-gold text-sm tracking-widest">Á</span>
            </div>
            <div>
              <p className="text-white text-xs tracking-widest uppercase font-light">Ápice</p>
              <p className="text-ink-pale text-2xs tracking-widest">by Black Premium</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-sm font-light tracking-wide',
                  active
                    ? 'bg-ink-dim text-gold'
                    : 'text-ink-pale hover:text-white hover:bg-ink-dim'
                )}
              >
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-ink-dim">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-ink-pale hover:text-danger transition-colors text-sm font-light"
          >
            <LogOut size={15} strokeWidth={1.5} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-card2 bg-white sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-ink-pale hover:text-ink">
            <Menu size={20} />
          </button>
          <span className="font-serif italic text-gold text-lg">Ápice</span>
          <div className="w-5" />
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
