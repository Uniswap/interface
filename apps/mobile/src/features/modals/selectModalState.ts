import { MobileState } from 'src/app/mobileReducer'
import { ModalsState } from 'src/features/modals/ModalsState'

export function selectModalState<T extends keyof ModalsState>(name: T): (state: MobileState) => ModalsState[T] {
  return (state) => state.modals[name]
}
