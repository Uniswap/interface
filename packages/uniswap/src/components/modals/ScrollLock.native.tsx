import { NotImplementedError } from 'utilities/src/errors'

export function initializeScrollWatcher(): void {
  throw new NotImplementedError('initializeScrollWatcher')
}

export function updateScrollLock(_props: { isModalOpen: boolean }): void {
  throw new NotImplementedError('updateScrollLock')
}

export function useUpdateScrollLock(_props: { isModalOpen: boolean }): void {
  throw new NotImplementedError('useUpdateScrollLock')
}
