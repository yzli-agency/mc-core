import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMarketplace } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Store, Download, Trash2, Star, Search, Package } from 'lucide-react'
import type { MarketplaceModule } from '@/lib/api'

async function installModule(id: string) {
  const res = await fetch(`/api/marketplace/${id}/install`, { method: 'POST' })
  if (!res.ok) throw new Error('Install failed')
  return res.json()
}

async function uninstallModule(id: string) {
  const res = await fetch(`/api/marketplace/${id}/uninstall`, { method: 'POST' })
  if (!res.ok) throw new Error('Uninstall failed')
  return res.json()
}

const categoryColors: Record<string, string> = {
  ai: 'text-primary bg-primary/10',
  data: 'text-dreamtime bg-dreamtime/10',
  automation: 'text-warning bg-warning/10',
  integration: 'text-success bg-success/10',
  analytics: 'text-muted-foreground bg-secondary',
}

export function Marketplace() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'installed' | 'available'>('all')

  const { data: modules, isLoading } = useQuery({
    queryKey: ['marketplace'],
    queryFn: getMarketplace,
    refetchInterval: 30000,
  })

  const installMut = useMutation({
    mutationFn: installModule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace'] }),
  })

  const uninstallMut = useMutation({
    mutationFn: uninstallModule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace'] }),
  })

  const filtered = modules?.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter =
      filter === 'all' ||
      (filter === 'installed' && m.installed) ||
      (filter === 'available' && !m.installed)
    return matchesSearch && matchesFilter
  })

  const installedCount = modules?.filter((m) => m.installed).length ?? 0
  const availableCount = (modules?.length ?? 0) - installedCount

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Marketplace
        </h1>
        <p className="text-sm text-muted-foreground">
          {installedCount} installed · {availableCount} available
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search modules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'installed', 'available'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'ghost'}
              onClick={() => setFilter(f)}
              className="h-8 text-xs capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Package className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No modules found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onInstall={() => installMut.mutate(mod.id)}
              onUninstall={() => uninstallMut.mutate(mod.id)}
              loading={
                (installMut.isPending || uninstallMut.isPending) &&
                (installMut.variables === mod.id || uninstallMut.variables === mod.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ModuleCard({
  module: mod,
  onInstall,
  onUninstall,
  loading,
}: {
  module: MarketplaceModule
  onInstall: () => void
  onUninstall: () => void
  loading: boolean
}) {
  return (
    <Card className="hover:border-primary/30 transition-colors flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">{mod.name}</CardTitle>
          {mod.installed && (
            <Badge variant="success" className="text-[10px] shrink-0">
              installed
            </Badge>
          )}
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-fit ${
            categoryColors[mod.category] ?? 'text-muted-foreground bg-secondary'
          }`}
        >
          {mod.category}
        </span>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        <p className="text-xs text-muted-foreground mb-3 flex-1">{mod.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {mod.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-secondary text-muted-foreground rounded px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{mod.author}</span>
            {mod.rating && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-warning" />
                <span>{mod.rating.toFixed(1)}</span>
              </div>
            )}
            <span>v{mod.version}</span>
          </div>
          {mod.installed ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={onUninstall}
              disabled={loading}
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </Button>
          ) : (
            <Button size="sm" className="h-7 text-xs" onClick={onInstall} disabled={loading}>
              <Download className="w-3 h-3" />
              Install
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
