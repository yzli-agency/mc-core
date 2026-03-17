import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Overview } from '@/views/Overview'
import { Clients } from '@/views/Clients'
import { Kanban } from '@/views/Kanban'
import { Pipeline } from '@/views/Pipeline'
import { Agents } from '@/views/Agents'
import { Cells } from '@/views/Cells'
import { Marketplace } from '@/views/Marketplace'
import { Logs } from '@/views/Logs'
import { Scheduler } from '@/views/Scheduler'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/cells" element={<Cells />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/scheduler" element={<Scheduler />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
