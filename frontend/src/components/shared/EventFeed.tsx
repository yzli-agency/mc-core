import { useRef, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { WSEvent } from '@/lib/api'
import { cn } from '@/lib/utils'

interface EventFeedProps {
  events: WSEvent[]
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  maxHeight?: string
}

const levelVariant: Record<string, 'default' | 'destructive' | 'warning' | 'success' | 'outline'> = {
  info: 'default',
  error: 'destructive',
  warning: 'warning',
  success: 'success',
  debug: 'outline',
}

const levelColor: Record<string, string> = {
  info: 'text-primary',
  error: 'text-destructive',
  warning: 'text-warning',
  success: 'text-success',
  debug: 'text-muted-foreground',
}

export function EventFeed({ events, status, maxHeight = '400px' }: EventFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn('w-2 h-2 rounded-full', {
            'bg-success animate-pulse': status === 'connected',
            'bg-warning animate-pulse': status === 'connecting',
            'bg-destructive': status === 'error' || status === 'disconnected',
          })}
        />
        <span className="text-xs text-muted-foreground font-mono capitalize">{status}</span>
        <span className="text-xs text-muted-foreground ml-auto">{events.length} events</span>
      </div>
      <ScrollArea style={{ maxHeight }} className="flex-1">
        <div className="space-y-1 pr-2">
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No events yet…</p>
          ) : (
            [...events].reverse().map((event, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs py-1 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground font-mono shrink-0 text-[10px] pt-0.5">
                  {formatDateTime(event.timestamp)}
                </span>
                <Badge
                  variant={levelVariant[event.level || 'info'] || 'outline'}
                  className="shrink-0 text-[10px] py-0 h-4"
                >
                  {event.level || 'info'}
                </Badge>
                {event.agent && (
                  <span className="text-dreamtime shrink-0 font-mono">[{event.agent}]</span>
                )}
                <span className={cn('flex-1 break-all', levelColor[event.level || 'info'])}>
                  {event.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
