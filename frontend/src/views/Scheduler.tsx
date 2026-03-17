import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCalendar } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDate } from '@/lib/utils'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Timer,
} from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import type { CalendarEvent } from '@/lib/api'

const eventTypeColor: Record<string, string> = {
  task: 'bg-primary/20 text-primary border-primary/30',
  meeting: 'bg-dreamtime/20 text-dreamtime border-dreamtime/30',
  deadline: 'bg-destructive/20 text-destructive border-destructive/30',
  reminder: 'bg-warning/20 text-warning border-warning/30',
}

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Timer className="w-3 h-3" />,
  in_progress: <Clock className="w-3 h-3" />,
  done: <CheckCircle className="w-3 h-3" />,
}

export function Scheduler() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar'],
    queryFn: getCalendar,
    refetchInterval: 30000,
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const getEventsForDay = (day: Date) =>
    events?.filter((e) => isSameDay(new Date(e.date), day)) ?? []

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const upcomingEvents = events
    ?.filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10) ?? []

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Scheduler
        </h1>
        <p className="text-sm text-muted-foreground">{events?.length ?? 0} scheduled events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium capitalize">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setCurrentDate(new Date())}
                >
                  <span className="text-xs">Today</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-muted-foreground py-1 font-medium"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="grid grid-cols-7 gap-0.5">
                {calDays.map((day) => {
                  const dayEvents = getEventsForDay(day)
                  const isSelected = selectedDay && isSameDay(day, selectedDay)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const today = isToday(day)

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'relative h-12 rounded p-1 text-xs transition-colors text-left',
                        isCurrentMonth
                          ? 'hover:bg-secondary text-foreground'
                          : 'text-muted-foreground/40 hover:bg-secondary/50',
                        isSelected && 'bg-primary/10 border border-primary/40',
                        today && 'border border-primary/60'
                      )}
                    >
                      <span
                        className={cn(
                          'font-medium',
                          today && 'text-primary',
                          isSelected && 'text-primary'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
                          {dayEvents.slice(0, 3).map((e) => (
                            <span
                              key={e.id}
                              className={cn(
                                'block h-1 w-1 rounded-full',
                                e.type === 'task' && 'bg-primary',
                                e.type === 'deadline' && 'bg-destructive',
                                e.type === 'meeting' && 'bg-dreamtime',
                                e.type === 'reminder' && 'bg-warning'
                              )}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] text-muted-foreground leading-none">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Selected day events */}
            {selectedDay && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {format(selectedDay, 'EEEE d MMMM')} — {selectedEvents.length} event(s)
                </p>
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nothing scheduled.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedEvents.map((event) => (
                      <EventItem key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Nothing upcoming.</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 p-2 rounded border border-border/50 bg-background/50"
                >
                  <div
                    className={cn(
                      'mt-0.5 shrink-0',
                      event.type === 'deadline' && 'text-destructive',
                      event.type === 'task' && 'text-primary',
                      event.type === 'meeting' && 'text-dreamtime',
                      event.type === 'reminder' && 'text-warning'
                    )}
                  >
                    {statusIcon[event.status]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(event.date)}
                      {event.time && ` · ${event.time}`}
                    </p>
                    {event.agent && (
                      <span className="text-[10px] text-dreamtime">@{event.agent}</span>
                    )}
                  </div>
                  <Badge
                    variant={
                      event.type === 'deadline'
                        ? 'destructive'
                        : event.type === 'task'
                          ? 'default'
                          : 'outline'
                    }
                    className="text-[10px] py-0 h-4 shrink-0"
                  >
                    {event.type}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EventItem({ event }: { event: CalendarEvent }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded border text-xs',
        eventTypeColor[event.type] ?? 'border-border'
      )}
    >
      <span className="shrink-0">{statusIcon[event.status]}</span>
      <span className="flex-1 truncate">{event.title}</span>
      {event.time && <span className="font-mono text-[10px]">{event.time}</span>}
      {event.agent && <span className="text-dreamtime font-mono text-[10px]">@{event.agent}</span>}
    </div>
  )
}
