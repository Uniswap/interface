export const noOpFunction = (): void => {
  return
}

interface ThrowingProxyOptions {
  /** Array of method/property names that should throw when accessed. Use '*' for all properties. */
  throwingMethods: string[]
  /** Custom error message (defaults to 'Simulated error') */
  errorMessage?: string
}

/**
 * Creates a proxy that throws an error when specified methods are accessed.
 * Useful for testing catch block fallback behavior in migrations.
 *
 * @example
 * // Create an array that throws when forEach is called
 * const throwingArray = createThrowingProxy([], { throwingMethods: ['forEach'] })
 *
 * @example
 * // Create an object that throws when any property is accessed
 * const throwingObj = createThrowingProxy({}, { throwingMethods: ['*'] })
 */
export function createThrowingProxy<T extends object>(target: T, options: ThrowingProxyOptions): T {
  const { throwingMethods, errorMessage = 'Simulated error' } = options
  return new Proxy(target, {
    get(obj, prop): unknown {
      if (throwingMethods.includes('*') || throwingMethods.includes(String(prop))) {
        throw new Error(errorMessage)
      }
      return Reflect.get(obj, prop)
    },
  })
}
