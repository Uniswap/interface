import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, AppState } from 'state'

import { setShowTutorial } from './actions'
import { DEFAULT_TUTORIAL_STATE } from './reducer'

type TutorialParam = { show?: boolean; step?: number }
export function useTutorialSwapGuide(): [TutorialParam, (value: TutorialParam) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const { swap } = useSelector((state: AppState) => state.tutorial) || DEFAULT_TUTORIAL_STATE
  const setShow = useCallback(({ show, step }: TutorialParam) => dispatch(setShowTutorial({ show, step })), [dispatch])
  return [swap as TutorialParam, setShow]
}
