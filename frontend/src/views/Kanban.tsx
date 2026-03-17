import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { getKanban, moveTask, triggerTask, getClients, getProjects } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatDate } from '@/lib/utils'
import { Plus, GripVertical, Zap } from 'lucide-react'
import type { Task } from '@/lib/api'

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'text-muted-foreground' },
  { id: 'todo', label: 'To Do', color: 'text-foreground' },
  { id: 'in_progress', label: 'In Progress', color: 'text-warning' },
  { id: 'done', label: 'Done', color: 'text-success' },
]

const priorityVariant: Record<string, 'destructive' | 'warning' | 'outline'> = {
  high: 'destructive',
  medium: 'warning',
  low: 'outline',
}

export function Kanban() {
  const qc = useQueryClient()
  const [clientSlug, setClientSlug] = useState<string>('')
  const [projectSlug, setProjectSlug] = useState<string>('')

  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: getClients })
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects })

  const { data: board, isLoading } = useQuery({
    queryKey: ['kanban', clientSlug, projectSlug],
    queryFn: () =>
      getKanban({
        client_slug: clientSlug || undefined,
        project_slug: projectSlug || undefined,
      }),
    refetchInterval: 10000,
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, column }: { id: string; column: string }) => moveTask(id, column),
    onMutate: async ({ id, column }) => {
      await qc.cancelQueries({ queryKey: ['kanban', clientSlug, projectSlug] })
      const prev = qc.getQueryData(['kanban', clientSlug, projectSlug])
      qc.setQueryData(['kanban', clientSlug, projectSlug], (old: { columns: Record<string, Task[]> } | undefined) => {
        if (!old) return old
        const newCols = { ...old.columns }
        let task: Task | undefined
        for (const col of Object.keys(newCols)) {
          const idx = newCols[col].findIndex((t: Task) => t.id === id)
          if (idx !== -1) {
            task = { ...newCols[col][idx], column: column as Task['column'] }
            newCols[col] = newCols[col].filter((_: Task, i: number) => i !== idx)
            break
          }
        }
        if (task) newCols[column] = [...(newCols[column] || []), task]
        return { ...old, columns: newCols }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['kanban', clientSlug, projectSlug], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['kanban', clientSlug, projectSlug] }),
  })

  const triggerMutation = useMutation({
    mutationFn: (id: string) => triggerTask(id),
  })

  const onDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result
    if (!destination) return
    moveMutation.mutate({ id: draggableId, column: destination.droppableId })
  }

  const clientProjects = projects?.filter((p) => !clientSlug || p.client_slug === clientSlug) ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Kanban</h1>
          <p className="text-sm text-muted-foreground">Drag & drop task management</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={clientSlug} onValueChange={setClientSlug}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All clients</SelectItem>
              {clients?.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectSlug} onValueChange={setProjectSlug}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All projects</SelectItem>
              {clientProjects.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="space-y-2">
              <Skeleton className="h-6 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-4 min-h-[600px]">
            {COLUMNS.map((col) => {
              const tasks = board?.columns?.[col.id] ?? []
              return (
                <div key={col.id} className="kanban-col">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', col.color)}>{col.label}</span>
                      <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                        {tasks.length}
                      </span>
                    </div>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'flex-1 p-2 space-y-2 min-h-[100px]',
                          snapshot.isDraggingOver && 'bg-primary/5'
                        )}
                      >
                        {tasks.map((task: Task, index: number) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  'kanban-card',
                                  snapshot.isDragging && 'rotate-1 shadow-lg border-primary/40'
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-0.5 text-muted-foreground/50"
                                  >
                                    <GripVertical className="w-3 h-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium leading-snug line-clamp-2">
                                      {task.title}
                                    </p>
                                    {task.description && (
                                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                                      <Badge
                                        variant={priorityVariant[task.priority] ?? 'outline'}
                                        className="text-[10px] py-0 h-4"
                                      >
                                        {task.priority}
                                      </Badge>
                                      {task.agent && (
                                        <span className="text-[10px] text-dreamtime font-mono">
                                          @{task.agent}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        {formatDate(task.updated_at)}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={() => triggerMutation.mutate(task.id)}
                                        title="Trigger agent"
                                      >
                                        <Zap className="w-3 h-3 text-primary" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}
