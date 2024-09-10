import { PlatformSplitStubError } from 'utilities/src/errors'

export function initializeScrollWatcher(): void {
  throw new PlatformSplitStubError('initializeScrollWatcher')
}

export function updateScrollLock(_props: { isModalOpen: boolean }): void {
  throw new PlatformSplitStubError('updateScrollLock')
}

export function useUpdateScrollLock(_props: { isModalOpen: boolean }): void {
  throw new PlatformSplitStubError('useUpdateScrollLock')
}
