import { createSlice } from '@reduxjs/toolkit'

//------------------------------------------------------------------------------------------------
// Splash Screen
//------------------------------------------------------------------------------------------------

export enum SplashScreenVisibility {
  INIT = 'init',
  HIDDEN = 'hidden',
}

export interface SplashScreenState {
  visibility: SplashScreenVisibility
}

const initialState: SplashScreenState = {
  visibility: SplashScreenVisibility.INIT,
}

export const splashScreenSlice = createSlice({
  name: 'splashScreen',
  initialState,
  reducers: {
    hideSplashScreen: (state) => {
      state.visibility = SplashScreenVisibility.HIDDEN
    },
  },
})

export const { hideSplashScreen } = splashScreenSlice.actions
export const splashScreenReducer = splashScreenSlice.reducer

//------------------------------
// Splash Screen selectors
//------------------------------

export const selectSplashScreen = (state: { splashScreen: SplashScreenState }): SplashScreenState['visibility'] =>
  state.splashScreen.visibility

export const selectSplashScreenIsHidden = (state: { splashScreen: SplashScreenState }): boolean =>
  selectSplashScreen(state) === SplashScreenVisibility.HIDDEN
