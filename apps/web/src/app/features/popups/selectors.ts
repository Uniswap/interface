import { WebState } from 'src/background/store'
import { PopupsState } from './slice'

export function selectPopupState<T extends keyof PopupsState>(
  name: T
): (state: WebState) => PopupsState[T] {
  return (state) => state.popups[name]
}
