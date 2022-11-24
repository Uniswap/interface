import { createAction } from '@reduxjs/toolkit'

import { StepTutorial } from 'components/Tutorial/TutorialSwap/constant'

export const setShowTutorial = createAction<{ show?: boolean; step?: number; stepInfo?: StepTutorial }>(
  'tutorial/setShowTutorial',
)
