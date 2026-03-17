import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  accentColor?: string
  isLoading?: boolean
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  accentColor = 'text-primary',
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
            <p className={cn('font-mono text-2xl font-semibold', accentColor)}>{value}</p>
            {trend && (
              <p className={cn('text-xs mt-1', trendUp ? 'text-success' : 'text-muted-foreground')}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn('p-2 rounded-md bg-secondary', accentColor)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
