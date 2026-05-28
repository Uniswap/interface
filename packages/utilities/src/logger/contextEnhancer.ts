import { PlatformSplitStubError } from 'utilities/src/errors'

export function logContextUpdate(_contextName: string, _newState: unknown): void {
  throw new PlatformSplitStubError('logContextUpdate')
}
