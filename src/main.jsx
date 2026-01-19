import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { Overview } from './pages/Overview'
import { Appointments } from './pages/Appointments'
import { CategorySettings } from './pages/CategorySettings'
import { AccountSettings } from './pages/AccountSettings'
import { NotificationsSettings } from './pages/NotificationsSettings'
import { DateSettings } from './pages/DateSettings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'appointments', element: <Appointments /> },
      { path: 'settings/account', element: <AccountSettings /> },
      { path: 'settings/notifications', element: <NotificationsSettings /> },
      { path: 'settings/dates', element: <DateSettings /> },
      { path: 'settings/categories', element: <CategorySettings /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
