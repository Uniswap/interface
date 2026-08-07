import { NotImplementedError } from 'utilities/src/errors'

export function createCrossOriginWorker(_workerUrl: string): Worker {
  throw new NotImplementedError('createCrossOriginWorker')
}
