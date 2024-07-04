import { ProfilePageStateType } from 'nft/types'
import { devtools } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

interface profilePageState {
  /**
   * State of user settings
   */
  state: ProfilePageStateType
  setProfilePageState: (state: ProfilePageStateType) => void
}

export const useProfilePageState = createWithEqualityFn<profilePageState>()(
  devtools(
    (set) => ({
      state: ProfilePageStateType.VIEWING,
      setProfilePageState: (newState) =>
        set(() => ({
          state: newState,
        })),
    }),
    { name: 'useProfilePageState' },
  ),
  shallow,
)
