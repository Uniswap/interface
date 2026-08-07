/**
 * Thrown when a delegated call carries a `value` that is not a valid `0x`-prefixed
 * hex string. The Trading API's `encode_7702`/`encode_4337` endpoints reject
 * `calls[].value` unless it matches `/^0x[a-fA-F0-9]+$/`, so a malformed value
 * (e.g. a decimal `"0"`) would otherwise fail as an opaque API 400. Throwing here
 * surfaces the offending value loudly at the source.
 */
export class InvalidDelegatedCallValueError extends Error {
  constructor(value: string) {
    super(`Delegated call value is not a valid hex string: ${value}`)
    this.name = 'InvalidDelegatedCallValueError'
  }
}
