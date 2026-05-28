import { Mutable } from '~/types/mutable'

export function cloneReadonly<T extends object>(obj: T): Mutable<T> {
  // oxlint-disable-next-line typescript/no-unsafe-return -- biome-parity: oxlint is stricter here
  return JSON.parse(JSON.stringify(obj))
}
