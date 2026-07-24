import { PlatformSplitStubError } from 'utilities/src/errors'

export type RecyclingBooleanState = {
  value: boolean
  setTrue: () => void
  setFalse: () => void
  toggle: () => void
  setValue: (value: boolean) => void
}

export function useRecyclingBooleanState(_initialValue = false): RecyclingBooleanState {
  throw new PlatformSplitStubError('useRecyclingBooleanState')
}
