import { PopupsState } from 'src/app/features/popups/slice'
import { WebState } from 'src/store/webReducer'

export function selectPopupState<T extends keyof PopupsState>(name: T): (state: WebState) => PopupsState[T] {
  return (state) => state.popups[name]
}
