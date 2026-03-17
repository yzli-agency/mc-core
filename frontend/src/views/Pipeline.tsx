import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPipeline, generatePipeline, getClients, getProjects } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { GitBranch, FileText, Play, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'
import type { PipelineCell, Doc } from '@/lib/api'

const cellStatusColor: Record<string, string> = {
  active: 'text-success border-success/30 bg-success/5',
  idle: 'text-muted-foreground border-border',
  processing: 'text-warning border-warning/30 bg-warning/5',
  error: 'text-destructive border-destructive/30 bg-destructive/5',
}

const docStatusVariant: Record<string, 'success' | 'warning' | 'outline' | 'default'> = {
  published: 'success',
  approved: 'success',
  review: 'warning',
  draft: 'outline',
}

const docStatusIcon: Record<string, React.ReactNode> = {
  published: <CheckCircle className="w-3 h-3" />,
  approved: <CheckCircle className="w-3 h-3" />,
  review: <Clock className="w-3 h-3" />,
  draft: <FileText className="w-3 h-3" />,
}

function DocItem({ doc }: { doc: Doc }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded border border-border/50 bg-background/50 hover:border-primary/20 transition-colors">
      <span className="text-muted-foreground">{docStatusIcon[doc.status]}</span>
      <span className="text-xs flex-1 truncate">{doc.title}</span>
      <Badge variant={docStatusVariant[doc.status] ?? 'outline'} className="text-[10px] py-0 h-4 shrink-0">
        {doc.status}
      </Badge>
    </div>
  )
}

function CellCard({ cell }: { cell: PipelineCell }) {
  const [expanded, setExpanded] = useState(false)
  const docsToShow = expanded ? cell.docs : cell.docs.slice(0, 3)

  return (
    <Card className={cn('border', cellStatusColor[cell.status] ?? '')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{cell.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                cell.status === 'active' || cell.status === 'processing'
                  ? 'success'
                  : cell.status === 'error'
                    ? 'destructive'
                    : 'outline'
              }
              className="text-[10px]"
            >
              {cell.status === 'processing' && (
                <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" />
              )}
              {cell.status}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{cell.role}</p>
        {cell.progress !== undefined && (
          <Progress value={cell.progress} className="h-1 mt-1" />
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          Docs ({cell.docs.length})
        </p>
        {docsToShow.map((doc) => (
          <DocItem key={doc.id} doc={doc} />
        ))}
        {cell.docs.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline mt-1"
          >
            {expanded ? 'Show less' : `+${cell.docs.length - 3} more`}
          </button>
        )}
        {cell.docs.length === 0 && (
          <p className="text-xs text-muted-foreground">No documents.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function Pipeline() {
  const [clientSlug, setClientSlug] = useState('')
  const [projectSlug, setProjectSlug] = useState('')

  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: getClients })
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects })

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['pipeline', clientSlug, projectSlug],
    queryFn: () =>
      getPipeline({
        client_slug: clientSlug || undefined,
        project_slug: projectSlug || undefined,
      }),
    refetchInterval: 15000,
  })

  const genMutation = useMutation({
    mutationFn: () =>
      generatePipeline({
        client_slug: clientSlug || undefined,
        project_slug: projectSlug || undefined,
      }),
  })

  const clientProjects = projects?.filter((p) => !clientSlug || p.client_slug === clientSlug) ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">6 cells × documents with statuses</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={clientSlug} onValueChange={setClientSlug}>
            <SelectTrigger className="w-36 h-8 text-xs">
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
            <SelectTrigger className="w-36 h-8 text-xs">
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
          <Button
            size="sm"
            onClick={() => genMutation.mutate()}
            disabled={genMutation.isPending}
          >
            {genMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Generate
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !pipeline?.cells?.length ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No pipeline data. Click Generate to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {pipeline.cells.map((cell) => (
            <CellCard key={cell.id} cell={cell} />
          ))}
        </div>
      )}
    </div>
  )
}
