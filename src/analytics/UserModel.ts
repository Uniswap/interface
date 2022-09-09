import { Identify, identify } from '@amplitude/analytics-browser'
import { isProductionEnv } from 'utils/env'

type Value = string | number | boolean | string[] | number[]

/**
 * Class that exposes methods to mutate the User Model's properties in
 * Amplitude that represents the current session's user.
 *
 * See https://help.amplitude.com/hc/en-us/articles/115002380567-User-properties-and-event-properties
 * for details.
 */
class UserModel {
  private log(method: string, ...parameters: unknown[]) {
    console.debug(`[amplitude(Identify)]: ${method}(${parameters})`)
  }

  private call(mutate: (event: Identify) => Identify) {
    if (!isProductionEnv()) {
      const log = (_: Identify, method: string) => this.log.bind(this, method)
      mutate(new Proxy(new Identify(), { get: log }))
      return
    }
    identify(mutate(new Identify()))
  }

  set(key: string, value: Value) {
    this.call((event) => event.set(key, value))
  }

  setOnce(key: string, value: Value) {
    this.call((event) => event.setOnce(key, value))
  }

  add(key: string, value: number) {
    this.call((event) => event.add(key, value))
  }

  postInsert(key: string, value: string | number) {
    this.call((event) => event.postInsert(key, value))
  }

  remove(key: string, value: string | number) {
    this.call((event) => event.remove(key, value))
  }
}

export const user = new UserModel()
