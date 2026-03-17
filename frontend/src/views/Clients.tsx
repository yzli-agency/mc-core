import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClients, getProjects, getAllProjects, createClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { Plus, ChevronRight, Building2, FolderOpen } from 'lucide-react'
import type { Client } from '@/lib/api'

const statusVariant: Record<string, 'success' | 'warning' | 'outline'> = {
  active: 'success',
  pending: 'warning',
  inactive: 'outline',
}

export function Clients() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
    refetchInterval: 10000,
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
  })

  const mutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      setNewName('')
      setShowForm(false)
    },
  })

  const clientProjects = projects?.filter((p) => p.client_slug === selected?.slug) ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients?.length ?? 0} clients</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          New Client
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Client name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && mutation.mutate({ name: newName })}
              />
              <Button
                size="sm"
                onClick={() => mutation.mutate({ name: newName })}
                disabled={!newName || mutation.isPending}
              >
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Client List */}
        <div className="lg:col-span-1 space-y-2">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))
            : clients?.map((client) => (
                <Card
                  key={client.slug}
                  className={`cursor-pointer transition-colors hover:border-primary/40 ${
                    selected?.slug === client.slug ? 'border-primary/60 bg-primary/5' : ''
                  }`}
                  onClick={() => setSelected(client)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{client.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[client.status] ?? 'outline'}>
                          {client.status}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      Since {formatDate(client.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Client Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {selected.name}
                  <Badge variant={statusVariant[selected.status] ?? 'outline'} className="ml-auto">
                    {selected.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selected.description && (
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    Projects ({clientProjects.length})
                  </p>
                  {clientProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {clientProjects.map((project) => (
                        <div
                          key={project.slug}
                          className="flex items-center gap-3 p-3 rounded-md border border-border bg-background"
                        >
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(project.created_at)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              project.status === 'active'
                                ? 'success'
                                : project.status === 'completed'
                                  ? 'outline'
                                  : 'warning'
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">Select a client to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
