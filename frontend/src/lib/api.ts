const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API Error ${res.status}: ${error}`)
  }
  return res.json()
}

// ─── Stats ─────────────────────────────────────────────────────────────────
export const getStats = () => request<Stats>('/stats')

// ─── Clients ───────────────────────────────────────────────────────────────
export const getClients = () => request<Client[]>('/clients')
export const createClient = (data: Partial<Client>) =>
  request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) })
export const getClient = (slug: string) => request<Client>(`/clients/${slug}`)
export const updateClient = (slug: string, data: Partial<Client>) =>
  request<Client>(`/clients/${slug}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteClient = (slug: string) =>
  request(`/clients/${slug}`, { method: 'DELETE' })

// ─── Projects ──────────────────────────────────────────────────────────────
export const getProjects = () => request<Project[]>('/projects')
export const createProject = (data: Partial<Project>) =>
  request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) })

// ─── Kanban ────────────────────────────────────────────────────────────────
export const getKanban = (params?: { client_slug?: string; project_slug?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString()
  return request<KanbanBoard>(`/kanban${q ? `?${q}` : ''}`)
}
export const getTasks = () => request<Task[]>('/tasks')
export const createTask = (data: Partial<Task>) =>
  request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) })
export const moveTask = (id: string, column: string) =>
  request(`/tasks/${id}/move`, { method: 'POST', body: JSON.stringify({ column }) })
export const triggerTask = (id: string) =>
  request(`/tasks/${id}/trigger`, { method: 'POST' })

// ─── Agents ────────────────────────────────────────────────────────────────
export const getAgents = () => request<Agent[]>('/agents')
export const getAgentsTree = () => request<AgentNode>('/agents/tree')
export const runAgent = (data: { agent: string; task?: string }) =>
  request('/agents/run', { method: 'POST', body: JSON.stringify(data) })

// ─── Pipeline ──────────────────────────────────────────────────────────────
export const getPipeline = (params?: { client_slug?: string; project_slug?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString()
  return request<PipelineData>(`/pipeline${q ? `?${q}` : ''}`)
}
export const generatePipeline = (data: Record<string, unknown>) =>
  request('/pipeline/generate', { method: 'POST', body: JSON.stringify(data) })

// ─── Docs ──────────────────────────────────────────────────────────────────
export const getDocs = () => request<Doc[]>('/docs')

// ─── Cells ─────────────────────────────────────────────────────────────────
export const getCells = () => request<Cell[]>('/cells')
export const getRoles = () => request<Role[]>('/roles')

// ─── Logs ──────────────────────────────────────────────────────────────────
export const getLogs = (params?: { agent?: string; level?: string; limit?: number }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString()
  return request<LogEntry[]>(`/logs${q ? `?${q}` : ''}`)
}

// ─── Calendar ──────────────────────────────────────────────────────────────
export const getCalendar = () => request<CalendarEvent[]>('/calendar')

// ─── Marketplace ───────────────────────────────────────────────────────────
export const getMarketplace = () => request<MarketplaceModule[]>('/marketplace')

// ─── Veille ────────────────────────────────────────────────────────────────
export const getVeilleTopics = () => request<VeilleTopic[]>('/veille/topics')
export const getVeilleDigests = () => request<VeilleDigest[]>('/veille/digests')

// ─── QMD ───────────────────────────────────────────────────────────────────
export const getQmdStats = () => request<QmdStats>('/qmd/stats')

// ─── Types ─────────────────────────────────────────────────────────────────
export interface Stats {
  active_agents: number
  total_tasks: number
  tasks_today: number
  active_clients: number
  active_projects: number
  memory_mb: number
  uptime_hours: number
  pipeline_cells: number
}

export interface Client {
  slug: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'pending'
  projects?: Project[]
  created_at: string
}

export interface Project {
  slug: string
  name: string
  client_slug: string
  status: 'active' | 'completed' | 'on_hold'
  description?: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  column: 'backlog' | 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  agent?: string
  client_slug?: string
  project_slug?: string
  created_at: string
  updated_at: string
}

export interface KanbanBoard {
  columns: {
    [key: string]: Task[]
  }
}

export interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'error' | 'stopped'
  parent?: string
  tasks_completed: number
  last_active?: string
}

export interface AgentNode {
  id: string
  name: string
  type: string
  status: string
  children?: AgentNode[]
}

export interface PipelineData {
  cells: PipelineCell[]
}

export interface PipelineCell {
  id: string
  name: string
  role: string
  status: 'active' | 'idle' | 'processing' | 'error'
  docs: Doc[]
  progress?: number
}

export interface Doc {
  id: string
  title: string
  type: string
  status: 'draft' | 'review' | 'approved' | 'published'
  cell?: string
  updated_at: string
}

export interface Cell {
  id: string
  name: string
  role: string
  status: 'active' | 'idle' | 'offline'
  agents: string[]
  description?: string
}

export interface Role {
  id: string
  name: string
  description: string
  cell?: string
  permissions: string[]
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'debug' | 'info' | 'warning' | 'error'
  agent: string
  message: string
  metadata?: Record<string, unknown>
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'task' | 'meeting' | 'deadline' | 'reminder'
  status: 'pending' | 'in_progress' | 'done'
  agent?: string
  client_slug?: string
}

export interface MarketplaceModule {
  id: string
  name: string
  description: string
  category: string
  version: string
  installed: boolean
  author: string
  tags: string[]
  rating?: number
}

export interface VeilleTopic {
  id: string
  name: string
  keywords: string[]
  active: boolean
  last_digest?: string
}

export interface VeilleDigest {
  id: string
  topic: string
  summary: string
  articles: number
  created_at: string
}

export interface QmdStats {
  total_notes: number
  total_memories: number
  db_size_mb: number
  last_sync: string
}

export interface WSEvent {
  type: string
  agent?: string
  message: string
  level?: string
  data?: Record<string, unknown>
  timestamp: string
}
