'use client'

import { ArrowUpIcon, ArrowDownIcon } from './icons'

interface KpiCardProps {
  title: string
  value: string | number
  variacao?: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
}

export default function KpiCard({ title, value, variacao, prefix, suffix, icon }: KpiCardProps) {
  const variacaoPositiva = variacao !== undefined && variacao >= 0

  return (
    <div className="bg-white-cream border border-card2 rounded-sm p-6 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest">{title}</span>
        {icon && <span className="text-ink-pale opacity-50">{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-jost font-light text-ink leading-none">
          {prefix && <span className="text-lg text-ink-pale mr-1">{prefix}</span>}
          {value}
          {suffix && <span className="text-lg text-ink-pale ml-1">{suffix}</span>}
        </p>
        {variacao !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-jost ${variacaoPositiva ? 'text-ok' : 'text-danger'}`}>
            {variacaoPositiva ? <ArrowUpIcon /> : <ArrowDownIcon />}
            <span>{Math.abs(variacao)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
