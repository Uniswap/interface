import { PlatformSplitStubError } from 'utilities/src/errors'

export function createCrossOriginWorker(_workerUrl: string): Worker {
  throw new PlatformSplitStubError('createCrossOriginWorker')
}
