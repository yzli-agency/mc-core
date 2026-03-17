/**
 * realtime.ts — Supabase Realtime hooks (replaces WebSocket ws.ts)
 * Uses postgres_changes subscriptions for live data.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from './supabase'
import type { AgentLogRow, KanbanCardRow, AgentRoleRow } from './database.types'
import type { LogEntry, Task, Agent, WSEvent } from './api'

// ─── Realtime Logs ──────────────────────────────────────────────────────────
export function useRealtimeLogs(maxLogs = 200) {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('realtime:agent_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_logs' },
        (payload) => {
          const row = payload.new as AgentLogRow
          const entry: LogEntry = {
            id: String(row.id),
            timestamp: row.logged_at ?? new Date().toISOString(),
            level: (row.level as LogEntry['level']) ?? 'info',
            agent: row.agent,
            message: row.message,
            metadata: row.context ? safeJsonParse(row.context) : undefined,
          }
          setLogs((prev) => [entry, ...prev].slice(0, maxLogs))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [maxLogs])

  const clearLogs = useCallback(() => setLogs([]), [])
  return { logs, clearLogs }
}

// ─── Realtime Kanban ────────────────────────────────────────────────────────
export function useRealtimeKanban() {
  const [updates, setUpdates] = useState<Task[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('realtime:kanban_cards')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_cards' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as KanbanCardRow
            const task: Task = {
              id: String(row.id),
              title: row.title,
              description: row.description ?? undefined,
              column: (row.column_name as Task['column']) ?? 'backlog',
              priority: (row.priority as Task['priority']) ?? 'medium',
              agent: row.assignee ?? undefined,
              client_slug: row.client_slug ?? undefined,
              project_slug: row.project_slug ?? undefined,
              created_at: row.created_at ?? new Date().toISOString(),
              updated_at: row.updated_at ?? new Date().toISOString(),
            }
            setUpdates((prev) => [task, ...prev].slice(0, 50))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return updates
}

// ─── Realtime Agents ────────────────────────────────────────────────────────
export function useRealtimeAgents() {
  const [updates, setUpdates] = useState<Agent[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('realtime:agent_roles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_roles' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as AgentRoleRow
            const agent: Agent = {
              id: String(row.id),
              name: row.name,
              type: row.level,
              status: 'idle',
              tasks_completed: 0,
              last_active: row.created_at ?? undefined,
            }
            setUpdates((prev) => [agent, ...prev].slice(0, 50))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return updates
}

// ─── Legacy EventBus shim (backwards-compat with useEventBus callers) ───────
type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseEventBusOptions {
  maxEvents?: number
  onEvent?: (event: WSEvent) => void
}

/**
 * Drop-in replacement for the old WebSocket-based useEventBus.
 * Subscribes to agent_logs via Supabase Realtime and surfaces events
 * in the same shape as the previous WS-based hook.
 */
export function useEventBus(options: UseEventBusOptions = {}) {
  const { maxEvents = 200, onEvent } = options
  const [events, setEvents] = useState<WSEvent[]>([])
  const [status, setStatus] = useState<WSStatus>('connecting')
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let mounted = true

    const channel = supabase
      .channel('event_bus:agent_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_logs' },
        (payload) => {
          if (!mounted) return
          const row = payload.new as AgentLogRow
          const event: WSEvent = {
            type: 'log',
            agent: row.agent,
            message: row.message,
            level: row.level ?? 'info',
            data: row.context ? safeJsonParse(row.context) : undefined,
            timestamp: row.logged_at ?? new Date().toISOString(),
          }
          setEvents((prev) => [event, ...prev].slice(0, maxEvents))
          onEventRef.current?.(event)
        }
      )
      .subscribe((state) => {
        if (!mounted) return
        if (state === 'SUBSCRIBED') setStatus('connected')
        else if (state === 'CLOSED') setStatus('disconnected')
        else if (state === 'CHANNEL_ERROR') setStatus('error')
      })

    setStatus('connecting')

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [maxEvents])

  const clearEvents = useCallback(() => setEvents([]), [])

  return { events, status, clearEvents }
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function safeJsonParse(s: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(s)
  } catch {
    return undefined
  }
}
