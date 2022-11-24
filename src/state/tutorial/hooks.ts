import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { StepTutorial } from 'components/Tutorial/TutorialSwap/constant'
import { AppDispatch, AppState } from 'state'

import { setShowTutorial } from './actions'
import { DEFAULT_TUTORIAL_STATE } from './reducer'

type TutorialParam = { show?: boolean; step?: number; stepInfo?: StepTutorial }
export function useTutorialSwapGuide(): [TutorialParam, (value: TutorialParam) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const { swap } = useSelector((state: AppState) => state.tutorial) || DEFAULT_TUTORIAL_STATE
  const setShow = useCallback((data: TutorialParam) => dispatch(setShowTutorial(data)), [dispatch])
  return [swap as TutorialParam, setShow]
}
