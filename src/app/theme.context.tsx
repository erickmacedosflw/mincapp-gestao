import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: ThemeMode
  toggleMode: () => void
}

const THEME_STORAGE_KEY = 'inspire_theme_mode'

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = {
  children: React.ReactNode
}

function getInitialMode(): ThemeMode {
  const storedMode = localStorage.getItem(THEME_STORAGE_KEY)

  if (storedMode === 'light' || storedMode === 'dark') {
    return storedMode
  }

  return 'light'
}

export function AppThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-mode', mode)
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => {
        setMode((current) => (current === 'light' ? 'dark' : 'light'))
      },
    }),
    [mode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useAppTheme deve ser usado dentro do AppThemeProvider.')
  }

  return context
}
