import { useQuery } from '@tanstack/react-query'
import { getStats, getQmdStats } from '@/lib/api'
import { useEventBus } from '@/lib/ws'
import { StatCard } from '@/components/shared/StatCard'
import { EventFeed } from '@/components/shared/EventFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Briefcase, CheckSquare, Clock, Database, Users, Zap, MemoryStick } from 'lucide-react'

export function Overview() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 5000,
  })

  const { data: qmd } = useQuery({
    queryKey: ['qmd-stats'],
    queryFn: getQmdStats,
    refetchInterval: 30000,
  })

  const { events, status } = useEventBus()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Mission Control — Yzli Studio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Agents"
          value={stats?.active_agents ?? 0}
          icon={Bot}
          accentColor="text-primary"
          isLoading={statsLoading}
        />
        <StatCard
          label="Active Clients"
          value={stats?.active_clients ?? 0}
          icon={Users}
          accentColor="text-success"
          isLoading={statsLoading}
        />
        <StatCard
          label="Active Projects"
          value={stats?.active_projects ?? 0}
          icon={Briefcase}
          accentColor="text-dreamtime"
          isLoading={statsLoading}
        />
        <StatCard
          label="Tasks Today"
          value={stats?.tasks_today ?? 0}
          icon={CheckSquare}
          accentColor="text-warning"
          isLoading={statsLoading}
        />
        <StatCard
          label="Total Tasks"
          value={stats?.total_tasks ?? 0}
          icon={Zap}
          isLoading={statsLoading}
        />
        <StatCard
          label="Pipeline Cells"
          value={stats?.pipeline_cells ?? 0}
          icon={Database}
          accentColor="text-primary"
          isLoading={statsLoading}
        />
        <StatCard
          label="Memory Usage"
          value={`${stats?.memory_mb ?? 0} MB`}
          icon={MemoryStick}
          accentColor="text-muted-foreground"
          isLoading={statsLoading}
        />
        <StatCard
          label="Uptime"
          value={`${stats?.uptime_hours ?? 0}h`}
          icon={Clock}
          accentColor="text-success"
          isLoading={statsLoading}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Event Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Live EventBus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EventFeed events={events} status={status} maxHeight="320px" />
          </CardContent>
        </Card>

        {/* QMD Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Memory System (QMD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Notes (Obsidian)</span>
              <span className="font-mono text-sm text-foreground">{qmd?.total_notes ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Memories (SQLite)</span>
              <span className="font-mono text-sm text-foreground">{qmd?.total_memories ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">DB Size</span>
              <span className="font-mono text-sm text-foreground">
                {qmd?.db_size_mb ? `${qmd.db_size_mb} MB` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Sync</span>
              <span className="font-mono text-xs text-muted-foreground">
                {qmd?.last_sync ? new Date(qmd.last_sync).toLocaleTimeString('fr-FR') : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
