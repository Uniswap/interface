import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { SellPageStateType } from '../types'

type sellPageState = {
  /**
   * State of user settings
   */
  state: SellPageStateType
  setSellPageState: (state: SellPageStateType) => void
}

export const useSellPageState = create<sellPageState>()(
  devtools(
    (set) => ({
      state: SellPageStateType.SELECTING,
      setSellPageState: (newState) =>
        set(() => ({
          state: newState,
        })),
    }),
    { name: 'use_sell_page_state' }
  )
)
