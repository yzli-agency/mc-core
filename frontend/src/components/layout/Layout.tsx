import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="ml-60 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
