import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import store from './index'
import { AppState } from './types'

export const useAppDispatch = () => useDispatch<typeof store.dispatch>()
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector
