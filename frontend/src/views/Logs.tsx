import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLogs, getAgents } from '@/lib/api'
import { useEventBus } from '@/lib/ws'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { cn, formatDateTime } from '@/lib/utils'
import { ScrollText, Trash2, Download, Wifi, WifiOff, Search } from 'lucide-react'
import type { LogEntry } from '@/lib/api'

const LEVELS = ['all', 'debug', 'info', 'warning', 'error'] as const

const levelStyle: Record<string, string> = {
  debug: 'text-muted-foreground',
  info: 'text-foreground',
  warning: 'text-warning',
  error: 'text-destructive',
}

const levelBg: Record<string, string> = {
  debug: 'bg-secondary/50',
  info: '',
  warning: 'bg-warning/5',
  error: 'bg-destructive/5',
}

const levelVariant: Record<string, 'outline' | 'warning' | 'destructive' | 'default'> = {
  debug: 'outline',
  info: 'default',
  warning: 'warning',
  error: 'destructive',
}

function LogLine({ entry }: { entry: LogEntry }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 px-3 py-1.5 border-b border-border/30 last:border-0 font-mono text-xs',
        levelBg[entry.level]
      )}
    >
      <span className="text-muted-foreground shrink-0 text-[10px] pt-0.5 w-[130px]">
        {formatDateTime(entry.timestamp)}
      </span>
      <Badge
        variant={levelVariant[entry.level] ?? 'outline'}
        className="text-[10px] py-0 h-4 shrink-0 w-14 justify-center"
      >
        {entry.level}
      </Badge>
      <span className="text-dreamtime shrink-0">[{entry.agent}]</span>
      <span className={cn('flex-1 break-all', levelStyle[entry.level])}>{entry.message}</span>
    </div>
  )
}

export function Logs() {
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [liveMode, setLiveMode] = useState(true)
  const [wsLogs, setWsLogs] = useState<LogEntry[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: getAgents })

  const { data: httpLogs, isLoading } = useQuery({
    queryKey: ['logs', agentFilter, levelFilter],
    queryFn: () =>
      getLogs({
        agent: agentFilter !== 'all' ? agentFilter : undefined,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        limit: 200,
      }),
    refetchInterval: liveMode ? 5000 : false,
  })

  const { events, status, clearEvents } = useEventBus({
    onEvent: (event) => {
      if (!liveMode) return
      const entry: LogEntry = {
        id: `ws-${Date.now()}-${Math.random()}`,
        timestamp: event.timestamp,
        level: (event.level as LogEntry['level']) ?? 'info',
        agent: event.agent ?? 'system',
        message: event.message,
      }
      setWsLogs((prev) => [entry, ...prev].slice(0, 500))
    },
  })

  const allLogs: LogEntry[] = liveMode
    ? [...wsLogs, ...(httpLogs ?? [])].slice(0, 500)
    : httpLogs ?? []

  const filtered = allLogs.filter((log) => {
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    const matchesAgent = agentFilter === 'all' || log.agent === agentFilter
    const matchesSearch = !search || log.message.toLowerCase().includes(search.toLowerCase())
    return matchesLevel && matchesAgent && matchesSearch
  })

  useEffect(() => {
    if (liveMode) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [wsLogs, liveMode])

  const downloadLogs = () => {
    const content = filtered
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.agent}] ${l.message}`)
      .join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-logs-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
  }

  return (
    <div className="p-6 space-y-4 h-screen flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} entries
            {liveMode && (
              <span className="ml-2">
                {status === 'connected' ? (
                  <span className="text-success flex items-center gap-1 inline-flex">
                    <Wifi className="w-3 h-3" />
                    Live
                  </span>
                ) : (
                  <span className="text-destructive flex items-center gap-1 inline-flex">
                    <WifiOff className="w-3 h-3" />
                    {status}
                  </span>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={liveMode ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setLiveMode(!liveMode)}
          >
            <Wifi className="w-3 h-3" />
            {liveMode ? 'Live' : 'Static'}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={downloadLogs}>
            <Download className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-destructive hover:text-destructive"
            onClick={() => { setWsLogs([]); clearEvents() }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs font-mono"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l} className="text-xs capitalize">
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents?.map((a) => (
              <SelectItem key={a.id} value={a.name}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log viewer */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-2 px-3 border-b border-border">
          <CardTitle className="text-xs font-mono text-muted-foreground flex items-center gap-2">
            <span>TIMESTAMP</span>
            <span>LEVEL</span>
            <span>AGENT</span>
            <span>MESSAGE</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-[calc(100vh-320px)]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading logs…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No logs matching filters.</div>
            ) : (
              <div>
                {filtered.map((log) => (
                  <LogLine key={log.id} entry={log} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
