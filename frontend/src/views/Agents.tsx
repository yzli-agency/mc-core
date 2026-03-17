import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAgents, getAgentsTree, runAgent } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Bot, Play, Square, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { AgentNode, Agent } from '@/lib/api'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
  active: 'success',
  idle: 'outline',
  error: 'destructive',
  stopped: 'outline',
}

const statusDot: Record<string, string> = {
  active: 'bg-success',
  idle: 'bg-muted-foreground',
  error: 'bg-destructive',
  stopped: 'bg-muted-foreground/50',
}

function AgentTreeNode({
  node,
  depth = 0,
  onKill,
}: {
  node: AgentNode
  depth?: number
  onKill?: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className={cn('agent-node flex items-center gap-2 mb-1', node.status)}
        style={{ marginLeft: depth * 20 }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="text-muted-foreground hover:text-foreground"
          >
            {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <div className="w-3 h-3 shrink-0" />
        )}
        <div className={cn('w-2 h-2 rounded-full shrink-0', statusDot[node.status] ?? 'bg-muted-foreground')} />
        <Bot className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium truncate">{node.name}</span>
          <span className="text-[10px] text-muted-foreground ml-2">{node.type}</span>
        </div>
        <Badge variant={statusVariant[node.status] ?? 'outline'} className="text-[10px] py-0 h-4">
          {node.status}
        </Badge>
        {(node.status === 'active') && onKill && (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 text-destructive hover:text-destructive"
            onClick={() => onKill(node.id)}
          >
            <Square className="w-3 h-3" />
          </Button>
        )}
      </div>
      {open && hasChildren && (
        <div className="border-l border-border/50 ml-4">
          {node.children!.map((child) => (
            <AgentTreeNode key={child.id} node={child} depth={depth + 1} onKill={onKill} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Agents() {
  const qc = useQueryClient()
  const [agentName, setAgentName] = useState('')

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
    refetchInterval: 5000,
  })

  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ['agents-tree'],
    queryFn: getAgentsTree,
    refetchInterval: 5000,
  })

  const runMutation = useMutation({
    mutationFn: runAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })

  const killAgent = (id: string) => {
    // POST /api/agents/{id}/stop — if endpoint available
    console.log('Kill agent:', id)
  }

  const stats = {
    active: agents?.filter((a) => a.status === 'active').length ?? 0,
    idle: agents?.filter((a) => a.status === 'idle').length ?? 0,
    error: agents?.filter((a) => a.status === 'error').length ?? 0,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Agents
          </h1>
          <p className="text-sm text-muted-foreground">{agents?.length ?? 0} agents registered</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success" />
            {stats.active} active
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            {stats.idle} idle
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            {stats.error} error
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Tree */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agent Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            {treeLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : tree ? (
              <AgentTreeNode node={tree} onKill={killAgent} />
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertCircle className="w-4 h-4" />
                No agent tree available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent List */}
        <div className="space-y-3">
          {/* Quick Run */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quick Run</p>
              <div className="flex gap-2">
                <input
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Agent name…"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => runMutation.mutate({ agent: agentName })}
                  disabled={!agentName || runMutation.isPending}
                >
                  <Play className="w-3 h-3" />
                  Run
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agent List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              : agents?.map((agent) => (
                  <Card key={agent.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            statusDot[agent.status] ?? 'bg-muted-foreground'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{agent.name}</span>
                            <span className="text-xs text-muted-foreground">{agent.type}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {agent.tasks_completed} tasks
                            </span>
                            {agent.last_active && (
                              <span className="text-xs text-muted-foreground">
                                Last: {new Date(agent.last_active).toLocaleTimeString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant={statusVariant[agent.status] ?? 'outline'} className="text-[10px]">
                          {agent.status}
                        </Badge>
                        {agent.status === 'active' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => killAgent(agent.id)}
                          >
                            <Square className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}
