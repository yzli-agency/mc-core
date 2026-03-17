import { useEffect, useRef, useState, useCallback } from 'react'
import type { WSEvent } from './api'

type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseEventBusOptions {
  maxEvents?: number
  onEvent?: (event: WSEvent) => void
}

export function useEventBus(options: UseEventBusOptions = {}) {
  const { maxEvents = 200, onEvent } = options
  const [events, setEvents] = useState<WSEvent[]>([])
  const [status, setStatus] = useState<WSStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const reconnectDelay = useRef(1000)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws/events`)
    wsRef.current = ws

    setStatus('connecting')

    ws.onopen = () => {
      if (!mountedRef.current) return
      setStatus('connected')
      reconnectDelay.current = 1000
    }

    ws.onmessage = (e) => {
      if (!mountedRef.current) return
      try {
        const event: WSEvent = JSON.parse(e.data)
        if (!event.timestamp) event.timestamp = new Date().toISOString()
        setEvents((prev) => [event, ...prev].slice(0, maxEvents))
        onEvent?.(event)
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setStatus('disconnected')
      // Auto-reconnect with exponential backoff
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000)
          connect()
        }
      }, reconnectDelay.current)
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      setStatus('error')
    }
  }, [maxEvents, onEvent])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const clearEvents = useCallback(() => setEvents([]), [])

  return { events, status, clearEvents }
}
