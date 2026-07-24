/**
 * A typed experiment definition. Declare one with {@link experiment} and pass it to
 * `useExperiment` for a typed `value` instead of `Record<string, unknown>`. The name is
 * the single source of truth; the value type is a compile-time-only annotation.
 */
export interface ExperimentDefinition<TValue extends Record<string, unknown>> {
  readonly name: string
  /** Phantom marker carrying the value shape — never read at runtime. */
  readonly __value?: TValue
}

/**
 * Define a reusable, typed experiment.
 *
 * ```ts
 * export const checkoutFlow = experiment<{ buttonColor: string }>('checkout_flow_v2')
 * const checkout = useExperiment(checkoutFlow) // checkout?.value.buttonColor is string
 * ```
 */
export function experiment<TValue extends Record<string, unknown> = Record<string, unknown>>(
  name: string,
): ExperimentDefinition<TValue> {
  return { name }
}
