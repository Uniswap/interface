type Truthy<T> = Exclude<T, null | undefined | false | '' | 0>

export function isTruthy<T>(value: T): value is Truthy<T> {
  return Boolean(value)
}
