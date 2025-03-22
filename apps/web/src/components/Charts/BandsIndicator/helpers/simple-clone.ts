import { Mutable } from 'types/mutable'

export function cloneReadonly<T extends object>(obj: T): Mutable<T> {
  return JSON.parse(JSON.stringify(obj))
}
