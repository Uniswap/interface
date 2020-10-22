import { useSelector } from 'react-redux'
import { AppState } from '../index'

export function useFeesState(): AppState['fees'] {
  return useSelector<AppState, AppState['fees']>(state => state.fees)
}
