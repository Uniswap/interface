import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { ProfilePageStateType } from '../types'

interface profilePageState {
  /**
   * State of user settings
   */
  state: ProfilePageStateType
  setProfilePageState: (state: ProfilePageStateType) => void
}

export const useProfilePageState = create<profilePageState>()(
  devtools(
    (set) => ({
      state: ProfilePageStateType.VIEWING,
      setProfilePageState: (newState) =>
        set(() => ({
          state: newState,
        })),
    }),
    { name: 'useProfilePageState' }
  )
)
