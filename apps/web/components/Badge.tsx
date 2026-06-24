type BadgeVariant = 'gold' | 'ok' | 'danger' | 'neutral' | 'ink'

const variants: Record<BadgeVariant, string> = {
  gold: 'bg-gold/10 text-gold border border-gold/30',
  ok: 'bg-ok/10 text-ok border border-ok/30',
  danger: 'bg-danger/10 text-danger border border-danger/30',
  neutral: 'bg-card2 text-ink-pale border border-card2',
  ink: 'bg-ink text-white-cream border border-ink',
}

export default function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode
  variant?: BadgeVariant
}) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-jost font-light ${variants[variant]}`}>
      {children}
    </span>
  )
}
