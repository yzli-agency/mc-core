import { useQuery } from '@tanstack/react-query'
import { getCells, getRoles } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Grid3X3, Users, Bot, Circle } from 'lucide-react'
import type { Cell } from '@/lib/api'

const statusColor: Record<string, string> = {
  active: 'text-success',
  idle: 'text-muted-foreground',
  offline: 'text-destructive',
}

const statusDot: Record<string, string> = {
  active: 'bg-success animate-pulse',
  idle: 'bg-muted-foreground',
  offline: 'bg-destructive/50',
}

function CellNode({ cell, x, y }: { cell: Cell; x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle
        r={40}
        className={cn(
          'fill-card stroke-2',
          cell.status === 'active' ? 'stroke-primary/60' : 'stroke-border'
        )}
        style={{ stroke: cell.status === 'active' ? 'hsl(166 85% 62% / 0.6)' : undefined }}
      />
      {cell.status === 'active' && (
        <circle r={40} className="fill-primary/5" />
      )}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground text-xs font-medium"
        style={{ fontSize: 10 }}
      >
        {cell.name.substring(0, 8)}
      </text>
      <text
        y={16}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        style={{ fontSize: 8 }}
      >
        {cell.agents.length} agents
      </text>
    </g>
  )
}

export function Cells() {
  const { data: cells, isLoading: cellsLoading } = useQuery({
    queryKey: ['cells'],
    queryFn: getCells,
    refetchInterval: 10000,
  })

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    refetchInterval: 30000,
  })

  // Arrange cells in a circle / grid
  const cellPositions = (cells ?? []).map((_, i, arr) => {
    const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2
    const radius = 120
    return {
      x: 200 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-primary" />
          Cells
        </h1>
        <p className="text-sm text-muted-foreground">Cell constellation & roles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SVG Constellation */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Constellation</CardTitle>
          </CardHeader>
          <CardContent>
            {cellsLoading ? (
              <Skeleton className="h-[400px] w-full rounded" />
            ) : (
              <svg viewBox="0 0 400 400" className="w-full max-h-[400px]">
                {/* Connection lines */}
                {cellPositions.map((pos, i) => {
                  const next = cellPositions[(i + 1) % cellPositions.length]
                  return (
                    <line
                      key={i}
                      x1={pos.x}
                      y1={pos.y}
                      x2={next.x}
                      y2={next.y}
                      stroke="hsl(196 40% 17%)"
                      strokeWidth={1}
                    />
                  )
                })}
                {/* Center hub */}
                <circle cx={200} cy={200} r={20} fill="hsl(166 85% 62% / 0.1)" stroke="hsl(166 85% 62% / 0.4)" strokeWidth={1} />
                <text x={200} y={200} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 9, fill: 'hsl(166 85% 62%)' }}>
                  CORE
                </text>
                {/* Hub to cell lines */}
                {cellPositions.map((pos, i) => (
                  <line
                    key={`hub-${i}`}
                    x1={200}
                    y1={200}
                    x2={pos.x}
                    y2={pos.y}
                    stroke="hsl(166 85% 62% / 0.1)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                ))}
                {/* Cell nodes */}
                {(cells ?? []).map((cell, i) => (
                  <CellNode
                    key={cell.id}
                    cell={cell}
                    x={cellPositions[i]?.x ?? 0}
                    y={cellPositions[i]?.y ?? 0}
                  />
                ))}
                {cells?.length === 0 && (
                  <text x={200} y={210} textAnchor="middle" style={{ fontSize: 12, fill: 'hsl(196 15% 66%)' }}>
                    No cells
                  </text>
                )}
              </svg>
            )}
          </CardContent>
        </Card>

        {/* Cell List */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Cells ({cells?.length ?? 0})
          </p>
          {cellsLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            : cells?.map((cell) => (
                <Card key={cell.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          statusDot[cell.status] ?? 'bg-muted-foreground'
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{cell.name}</span>
                          <Badge
                            variant={
                              cell.status === 'active'
                                ? 'success'
                                : cell.status === 'offline'
                                  ? 'destructive'
                                  : 'outline'
                            }
                            className="text-[10px]"
                          >
                            {cell.status}
                          </Badge>
                        </div>
                        <p className={cn('text-xs mb-2', statusColor[cell.status])}>{cell.role}</p>
                        {cell.description && (
                          <p className="text-xs text-muted-foreground mb-2">{cell.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {cell.agents.map((a, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono text-dreamtime bg-dreamtime/10 rounded px-1.5 py-0.5"
                            >
                              @{a}
                            </span>
                          ))}
                          {cell.agents.length === 0 && (
                            <span className="text-xs text-muted-foreground">No agents assigned</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Bot className="w-3 h-3" />
                        <span className="text-xs">{cell.agents.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

          {/* Roles */}
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-4">
            Roles ({roles?.length ?? 0})
          </p>
          {rolesLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            : roles?.map((role) => (
                <Card key={role.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{role.name}</span>
                      {role.cell && (
                        <span className="text-xs text-muted-foreground">→ {role.cell}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">{role.description}</p>
                    <div className="flex gap-1 flex-wrap mt-1 ml-6">
                      {role.permissions.map((p, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-secondary rounded px-1.5 py-0.5 text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </div>
  )
}
