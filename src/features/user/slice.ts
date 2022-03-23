import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { Palette } from 'src/styles/color'

type DynamicPalette = Pick<Palette, 'primary1' | 'secondary1' | 'background1' | 'textColor'>

export interface UserState {
  palette: DynamicPalette | null
  localPfp: string | null
  finishedOnboarding: boolean
}

const initialState: UserState = {
  palette: null,
  localPfp: null,
  finishedOnboarding: false,
}

export const slice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserPalette: (
      state,
      { payload: { newPalette } }: PayloadAction<{ newPalette: DynamicPalette }>
    ) => {
      state.palette = newPalette
    },
    setUserPfp: (state, { payload: { newPfp } }: PayloadAction<{ newPfp: string }>) => {
      state.localPfp = newPfp
    },
    setFinishedOnboarding: (
      state,
      { payload: { finishedOnboarding } }: PayloadAction<{ finishedOnboarding: boolean }>
    ) => {
      state.finishedOnboarding = finishedOnboarding
    },
  },
})

export const selectUserPalette = (state: RootState) => state.user.palette
export const selectUserLocalPfp = (state: RootState) => state.user.localPfp
export const selectFinishedOnboarding = (state: RootState) => state.user.finishedOnboarding

export const { setUserPalette, setUserPfp, setFinishedOnboarding } = slice.actions
export const { reducer: userReducer, actions: userActions } = slice
