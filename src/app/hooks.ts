import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState } from 'src/app/rootReducer'
import type { AppDispatch } from 'src/app/store'

// Use throughout the app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
