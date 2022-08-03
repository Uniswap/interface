import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type darkModeState = {
  /**
   * State of user settings
   */
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const useDarkMode = create<darkModeState>()(
  persist(
    devtools(
      (set) => ({
        isDarkMode: false,
        toggleDarkMode: () =>
          set(({ isDarkMode }) => ({
            isDarkMode: !isDarkMode,
          })),
      }),
      { name: 'use_dark_mode' }
    ),
    { name: 'use_dark_mode' }
  )
)
