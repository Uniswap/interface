import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { breakpoints } from '../css/sprinkles.css'

interface IsMobileState {
  isMobile: boolean
  width: number
  setMobileWidth: (width: number) => void
}

export const useIsMobile = create<IsMobileState>()(
  devtools(
    (set) => ({
      isMobile: true,
      width: 800,
      setMobileWidth: (width: number) =>
        set(() => ({
          width,
          isMobile: width < breakpoints.tabletSm,
        })),
    }),
    { name: 'isMobile' }
  )
)
