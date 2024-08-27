import { PopupsState } from 'src/app/features/popups/slice'
import { ExtensionState } from 'src/store/extensionReducer'

export function selectPopupState<T extends keyof PopupsState>(name: T): (state: ExtensionState) => PopupsState[T] {
  return (state) => state.popups[name]
}
