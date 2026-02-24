import { ConfigProvider, theme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { appRouter } from './router'
import { AppThemeProvider, useAppTheme } from './app/theme.context'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
})

function AppThemeShell() {
  const { mode } = useAppTheme()
  const isDark = mode === 'dark'

  return (
    <ConfigProvider
      theme={{
        cssVar: {},
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#3B67E0' : '#072E9E',
          colorLink: isDark ? '#89A5F5' : '#072E9E',
          colorBgLayout: isDark ? '#262A31' : '#F2F4F7',
          colorBgContainer: isDark ? '#2E333B' : '#FFFFFF',
          colorBorderSecondary: isDark ? '#3B414A' : '#F0F0F0',
        },
      }}
    >
      <RouterProvider router={appRouter} />
    </ConfigProvider>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AppThemeShell />
      </AppThemeProvider>
    </QueryClientProvider>
  )
}

export default App
