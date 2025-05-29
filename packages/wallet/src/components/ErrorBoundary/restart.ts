import { PlatformSplitStubError } from 'utilities/src/errors'

export const restart = (): void => {
  throw new PlatformSplitStubError('restart')
}
