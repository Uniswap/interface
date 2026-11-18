import { create } from 'zustand'

interface OnboardingChecklistStoreState {
  isVisible: boolean
  /** Mobile only: the checklist has not decided whether it will show, so the intro cards wait. */
  isLoading: boolean
  setIsVisible: (isVisible: boolean) => void
  setIsLoading: (isLoading: boolean) => void
}

/** Written by each app's checklist (app chrome), read by its notification service; shared here so neither imports the other. */
export const useOnboardingChecklistStore = create<OnboardingChecklistStoreState>()((set) => ({
  isVisible: false,
  isLoading: false,
  setIsVisible: (isVisible) => set({ isVisible }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
