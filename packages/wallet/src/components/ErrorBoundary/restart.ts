import { PlatformSplitStubError } from 'utilities/src/errors'

export const restartApp = (): void => {
  throw new PlatformSplitStubError('restartApp')
}
