import { SagaIterator, SagaMiddleware } from 'redux-saga'

/**
 * Saga effect runner utility
 * Executes saga effects outside of generator functions
 */

export type RunSagaEffect = <T>(effect: SagaIterator<T>) => Promise<T>

export function createSagaEffectRunner(sm: SagaMiddleware) {
  return function runSagaEffect<T>(effect: SagaIterator<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = sm.run(function* () {
        try {
          const result = yield effect
          resolve(result as T)
        } catch (error) {
          reject(error)
        }
      })
      task.toPromise().catch(reject) // Ensures the saga completes
    })
  }
}
