import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <div className="rounded-xl border-2 border-[var(--tf-primary)] bg-[var(--tf-component-bg)] bg-gradient-to-br from-[var(--tf-component-bg)] to-[var(--tf-surface)] p-6 transition-all duration-300 text-[var(--tf-text-primary)] shadow-lg hover:shadow-xl hover:border-[var(--tf-primary-focus)]">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-semibold text-[var(--tf-text-primary)]">{title}</h3>
        <Icon className="h-4 w-4 text-[var(--tf-primary)]" />
      </div>
      <div>
        <div className="text-2xl font-bold text-[var(--tf-text-primary)]">{value}</div>
        {description && (
          <p className="text-xs text-[var(--tf-text-secondary)]">{description}</p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <span
              className={`text-xs ${trend.isPositive ? 'text-[var(--tf-success)]' : 'text-[var(--tf-danger)]'}`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-[var(--tf-text-muted)] ml-1">
              from last month
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
