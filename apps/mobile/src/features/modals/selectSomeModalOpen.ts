import { MobileState } from 'src/app/mobileReducer'

export function selectSomeModalOpen(state: MobileState): boolean {
  return Object.values(state.modals).some((modalState) => modalState.isOpen)
}
