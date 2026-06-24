interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between pb-4 border-b border-gold/20 mb-6">
      <div>
        <h1 className="font-cormorant italic text-3xl text-ink font-normal">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm font-jost font-light text-ink-pale">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
