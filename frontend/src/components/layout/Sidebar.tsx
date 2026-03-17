import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Kanban,
  GitBranch,
  Bot,
  Grid3X3,
  Store,
  ScrollText,
  CalendarDays,
  Zap,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/kanban', label: 'Kanban', icon: Kanban },
  { to: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/cells', label: 'Cells', icon: Grid3X3 },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/scheduler', label: 'Scheduler', icon: CalendarDays },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex flex-col z-50">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-xs font-semibold text-primary tracking-widest uppercase leading-none">
              Mission Control
            </div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase font-mono mt-0.5">
              Yzli Stud/o
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="text-[10px] text-muted-foreground font-mono">
          v0.1.0 • FastAPI :8888
        </div>
      </div>
    </aside>
  )
}
