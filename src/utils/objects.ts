// To work around Object.keys losing types in Typescript
// Useful for maintaining string-like Enum types when getting keys, as for SupportedChainId
// Warning: Like Object.keys(), this returns strings
export function getKeys<T>(obj: T) {
  return Object.keys(obj) as Array<keyof T>
}

export function flattenObjectOfObjects<T>(obj: Record<any, Record<any, T>>): T[] {
  return Object.values(obj)
    .map((o) => Object.values(o))
    .flat()
}
