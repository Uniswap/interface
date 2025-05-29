import { NotImplementedError } from 'utilities/src/errors'

export interface CloseIfConsentedProps {
  onClose: () => void
}

export function useCloseIfConsented(_: CloseIfConsentedProps): void {
  throw new NotImplementedError('useCloseIfConsented')
}
