import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import store from 'state/index'

export const useAppDispatch = () => useDispatch<typeof store.dispatch>()
export const useAppSelector: TypedUseSelectorHook<ReturnType<typeof store.getState>> = useSelector
