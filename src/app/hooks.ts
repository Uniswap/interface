import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState } from 'src/app/rootReducer'
import type { AppDispatch } from 'src/app/store'
import { select } from 'typed-redux-saga'

// Use throughout the app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Use in sagas for better typing when selecting from redux state
export function* appSelect<T>(fn: (state: RootState) => T) {
  const state = yield* select(fn)
  return state
}
