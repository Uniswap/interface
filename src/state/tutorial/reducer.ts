import { createReducer } from '@reduxjs/toolkit'

import { StepTutorial } from 'components/Tutorial/TutorialSwap/constant'

import { setShowTutorial } from './actions'

interface TutorialState {
  swap: { show: boolean; step: number; stepInfo?: StepTutorial } // in the future we can have many tutorial per page
}

export const DEFAULT_TUTORIAL_STATE: TutorialState = { swap: { show: false, step: 0 } }

export default createReducer(DEFAULT_TUTORIAL_STATE, builder =>
  builder.addCase(setShowTutorial, (state, { payload: { show, step, stepInfo } }) => {
    if (!state) state = DEFAULT_TUTORIAL_STATE // for old user
    const swapTutorial = { ...state.swap }
    if (step !== undefined) swapTutorial.step = step
    if (show !== undefined) swapTutorial.show = show
    if (stepInfo !== undefined) swapTutorial.stepInfo = stepInfo
    state.swap = swapTutorial
  }),
)
