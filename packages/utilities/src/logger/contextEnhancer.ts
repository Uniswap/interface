import { PlatformSplitStubError } from 'utilities/src/errors'

// eslint-disable-next-line max-params
export function logContextUpdate(_contextName: string, _newState: unknown, _isDatadogEnabled: boolean): void {
  throw new PlatformSplitStubError('logContextUpdate')
}
