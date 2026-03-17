/**
 * api.ts — Supabase-backed data layer (replaces FastAPI /api/* calls)
 * All reads/writes go through the Supabase JS client.
 */
import { supabase } from './supabase'
import type {
  ClientRow,
  ProjectRow,
  KanbanCardRow,
  AgentRoleRow,
  CellRow,
  DocumentRow,
  AgentLogRow,
  CalendarTaskRow,
  VeilleTopicRow,
  VeilleDigestRow,
  InstalledModuleRow,
} from './database.types'

// ─── Stats ─────────────────────────────────────────────────────────────────
export async function getStats(): Promise<Stats> {
  const [clients, projects, tasks, tasksToday, logs] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('kanban_cards').select('id', { count: 'exact', head: true }),
    supabase
      .from('kanban_cards')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('agent_logs').select('id', { count: 'exact', head: true }),
  ])

  return {
    active_agents: 0,
    total_tasks: tasks.count ?? 0,
    tasks_today: tasksToday.count ?? 0,
    active_clients: clients.count ?? 0,
    active_projects: projects.count ?? 0,
    memory_mb: 0,
    uptime_hours: 0,
    pipeline_cells: 0,
  }
}

// ─── Clients ───────────────────────────────────────────────────────────────
export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapClient)
}

export async function getClient(slug: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw new Error(error.message)
  return mapClient(data)
}

export async function createClient(input: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      slug: input.slug!,
      name: input.name!,
      status: input.status ?? 'active',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapClient(data)
}

export async function updateClient(slug: string, input: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      name: input.name,
      status: input.status,
    })
    .eq('slug', slug)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapClient(data)
}

export async function deleteClient(slug: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('slug', slug)
  if (error) throw new Error(error.message)
}

// ─── Projects ──────────────────────────────────────────────────────────────
export async function getProjects(clientSlug?: string): Promise<Project[]> {
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (clientSlug && typeof clientSlug === 'string') query = query.eq('client_slug', clientSlug)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapProject)
}

/** No-arg version safe for direct use as TanStack Query queryFn */
export const getAllProjects = (): Promise<Project[]> => getProjects()

export async function createProject(input: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      slug: input.slug!,
      name: input.name!,
      client_slug: input.client_slug!,
      status: input.status ?? 'backlog',
      description: input.description,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapProject(data)
}

// ─── Kanban ────────────────────────────────────────────────────────────────
export async function getKanban(params?: {
  client_slug?: string
  project_slug?: string
}): Promise<KanbanBoard> {
  let query = supabase.from('kanban_cards').select('*').order('created_at')
  if (params?.client_slug) query = query.eq('client_slug', params.client_slug)
  if (params?.project_slug) query = query.eq('project_slug', params.project_slug)
  const { data, error } = await query
  if (error) throw new Error(error.message)

  const columns: KanbanBoard['columns'] = {}
  for (const card of data ?? []) {
    const col = card.column_name ?? 'Backlog'
    if (!columns[col]) columns[col] = []
    columns[col].push(mapKanbanCard(card))
  }
  return { columns }
}

export async function getTasks(params?: {
  client_slug?: string
  project_slug?: string
}): Promise<Task[]> {
  let query = supabase.from('kanban_cards').select('*').order('created_at', { ascending: false })
  if (params?.client_slug) query = query.eq('client_slug', params.client_slug)
  if (params?.project_slug) query = query.eq('project_slug', params.project_slug)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapKanbanCard)
}

export async function createTask(input: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('kanban_cards')
    .insert({
      title: input.title!,
      description: input.description,
      column_name: input.column ?? 'Backlog',
      priority: input.priority ?? 'normal',
      client_slug: input.client_slug,
      project_slug: input.project_slug,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapKanbanCard(data)
}

export async function moveTask(id: string, column: string): Promise<void> {
  const { error } = await supabase
    .from('kanban_cards')
    .update({ column_name: column, updated_at: new Date().toISOString() })
    .eq('id', Number(id))
  if (error) throw new Error(error.message)
}

export async function triggerTask(_id: string): Promise<void> {
  // Handled via Edge Function or direct action
  console.warn('triggerTask: not yet implemented via Supabase')
}

// ─── Agents ────────────────────────────────────────────────────────────────
export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agent_roles')
    .select('*')
    .order('level')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapAgent)
}

export async function getAgentsTree(): Promise<AgentNode> {
  const agents = await getAgents()
  const root: AgentNode = { id: 'root', name: 'Mission Control', type: 'root', status: 'active', children: [] }
  const map: Record<string, AgentNode> = {}
  for (const a of agents) {
    map[a.id] = { id: a.id, name: a.name, type: a.type, status: a.status, children: [] }
  }
  for (const a of agents) {
    if (a.parent && map[a.parent]) {
      map[a.parent].children!.push(map[a.id])
    } else {
      root.children!.push(map[a.id])
    }
  }
  return root
}

export async function runAgent(data: { agent: string; task?: string }): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_OPENCLAW_URL || 'http://localhost:18789'}/tools/invoke`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'sessions_spawn', args: { task: data.task, mode: 'run' } }),
    }
  )
  if (!response.ok) throw new Error(`Failed to spawn agent: ${response.status}`)
}

// ─── Pipeline ──────────────────────────────────────────────────────────────
export async function getPipeline(params?: {
  client_slug?: string
  project_slug?: string
}): Promise<PipelineData> {
  const [cellsRes, docsRes] = await Promise.all([
    supabase.from('cells').select('*').order('sort_order'),
    supabase
      .from('documents')
      .select('*')
      .order('created_at'),
  ])
  if (cellsRes.error) throw new Error(cellsRes.error.message)

  let docs = docsRes.data ?? []
  if (params?.client_slug) docs = docs.filter((d) => d.client_slug === params.client_slug)
  if (params?.project_slug) docs = docs.filter((d) => d.project_slug === params.project_slug)

  const cells: PipelineCell[] = (cellsRes.data ?? []).map((cell) => ({
    id: String(cell.id),
    name: cell.name,
    role: cell.mode ?? 'sequential',
    status: (cell.status as PipelineCell['status']) ?? 'idle',
    docs: docs
      .filter((d) => d.cell_from === cell.slug || d.cell_to === cell.slug)
      .map(mapDoc),
    progress: undefined,
  }))

  return { cells }
}

export async function generatePipeline(_data: Record<string, unknown>): Promise<void> {
  console.warn('generatePipeline: not yet implemented')
}

// ─── Docs ──────────────────────────────────────────────────────────────────
export async function getDocs(params?: { client_slug?: string; project_slug?: string }): Promise<Doc[]> {
  let query = supabase.from('documents').select('*').order('updated_at', { ascending: false })
  if (params?.client_slug) query = query.eq('client_slug', params.client_slug)
  if (params?.project_slug) query = query.eq('project_slug', params.project_slug)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapDoc)
}

// ─── Cells ─────────────────────────────────────────────────────────────────
export async function getCells(): Promise<Cell[]> {
  const { data, error } = await supabase
    .from('cells')
    .select('*, cell_roles(role_slug, is_lead)')
    .order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []).map((cell) => ({
    id: String(cell.id),
    name: cell.name,
    role: cell.mode ?? 'sequential',
    status: (cell.status as Cell['status']) ?? 'idle',
    agents: (cell.cell_roles as unknown as Array<{ role_slug: string }>)?.map((r) => r.role_slug) ?? [],
    description: cell.description ?? undefined,
  }))
}

export async function getRoles(): Promise<Role[]> {
  const { data, error } = await supabase.from('agent_roles').select('*').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    description: r.mission ?? '',
    cell: r.cells ? JSON.parse(r.cells)[0] : undefined,
    permissions: [],
  }))
}

// ─── Logs ──────────────────────────────────────────────────────────────────
export async function getLogs(params?: {
  agent?: string
  level?: string
  limit?: number
}): Promise<LogEntry[]> {
  let query = supabase
    .from('agent_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(params?.limit ?? 100)
  if (params?.agent) query = query.eq('agent', params.agent)
  if (params?.level) query = query.eq('level', params.level)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapLog)
}

// ─── Calendar ──────────────────────────────────────────────────────────────
export async function getCalendar(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_tasks')
    .select('*')
    .order('scheduled_at')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapCalendarTask)
}

// ─── Marketplace ───────────────────────────────────────────────────────────
export async function getMarketplace(): Promise<MarketplaceModule[]> {
  const [modulesRes, installedRes] = await Promise.all([
    supabase.from('registry_modules').select('*, registry_versions(version)').order('name'),
    supabase.from('installed_modules').select('module_slug, version'),
  ])
  if (modulesRes.error) throw new Error(modulesRes.error.message)

  const installedSlugs = new Set((installedRes.data ?? []).map((m) => m.module_slug))

  return (modulesRes.data ?? []).map((m) => {
    const versions = (m.registry_versions as unknown as Array<{ version: string }>) ?? []
    return {
      id: String(m.id),
      name: m.name,
      description: m.description ?? '',
      category: m.visibility ?? 'team',
      version: versions[versions.length - 1]?.version ?? '1.0.0',
      installed: installedSlugs.has(m.slug),
      author: 'Yzli',
      tags: [],
      rating: undefined,
    }
  })
}

// ─── Veille ────────────────────────────────────────────────────────────────
export async function getVeilleTopics(): Promise<VeilleTopic[]> {
  const { data, error } = await supabase
    .from('veille_topics')
    .select('*')
    .order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []).map((t) => ({
    id: String(t.id),
    name: t.name,
    keywords: t.keywords ? JSON.parse(t.keywords) : [],
    active: t.active ?? true,
    last_digest: undefined,
  }))
}

export async function getVeilleDigests(): Promise<VeilleDigest[]> {
  const { data, error } = await supabase
    .from('veille_digests')
    .select('*')
    .order('digest_date', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []).map((d) => ({
    id: String(d.id),
    topic: d.topics_covered ? JSON.parse(d.topics_covered)[0] ?? '' : '',
    summary: d.content ?? '',
    articles: d.article_count ?? 0,
    created_at: d.created_at ?? new Date().toISOString(),
  }))
}

// ─── QMD ───────────────────────────────────────────────────────────────────
export async function getQmdStats(): Promise<QmdStats> {
  // Placeholder — QMD stats come from a separate system
  return { total_notes: 0, total_memories: 0, db_size_mb: 0, last_sync: '' }
}

// ─── Mappers ───────────────────────────────────────────────────────────────
function mapClient(r: ClientRow): Client {
  return {
    slug: r.slug,
    name: r.name,
    description: undefined,
    status: (r.status as Client['status']) ?? 'active',
    created_at: r.created_at ?? new Date().toISOString(),
  }
}

function mapProject(r: ProjectRow): Project {
  return {
    slug: r.slug,
    name: r.name,
    client_slug: r.client_slug,
    status: (r.status as Project['status']) ?? 'active',
    description: r.description ?? undefined,
    created_at: r.created_at ?? new Date().toISOString(),
  }
}

function mapKanbanCard(r: KanbanCardRow): Task {
  return {
    id: String(r.id),
    title: r.title,
    description: r.description ?? undefined,
    column: (r.column_name as Task['column']) ?? 'backlog',
    priority: (r.priority as Task['priority']) ?? 'medium',
    agent: r.assignee ?? undefined,
    client_slug: r.client_slug ?? undefined,
    project_slug: r.project_slug ?? undefined,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: r.updated_at ?? new Date().toISOString(),
  }
}

function mapAgent(r: AgentRoleRow): Agent {
  return {
    id: String(r.id),
    name: r.name,
    type: r.level,
    status: 'idle',
    parent: undefined,
    tasks_completed: 0,
    last_active: r.created_at ?? undefined,
  }
}

function mapDoc(r: DocumentRow): Doc {
  return {
    id: String(r.id),
    title: r.title,
    type: r.type,
    status: (r.status as Doc['status']) ?? 'draft',
    cell: r.cell_from ?? undefined,
    updated_at: r.updated_at ?? new Date().toISOString(),
  }
}

function mapLog(r: AgentLogRow): LogEntry {
  return {
    id: String(r.id),
    timestamp: r.logged_at ?? new Date().toISOString(),
    level: (r.level as LogEntry['level']) ?? 'info',
    agent: r.agent,
    message: r.message,
    metadata: r.context ? JSON.parse(r.context) : undefined,
  }
}

function mapCalendarTask(r: CalendarTaskRow): CalendarEvent {
  return {
    id: String(r.id),
    title: r.title,
    date: r.scheduled_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    time: r.scheduled_at?.split('T')[1]?.substring(0, 5),
    type: (r.type as CalendarEvent['type']) ?? 'task',
    status: (r.status as CalendarEvent['status']) ?? 'pending',
    agent: r.agent ?? undefined,
    client_slug: r.client_slug ?? undefined,
  }
}

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
