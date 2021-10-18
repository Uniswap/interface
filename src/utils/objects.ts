// To work around Object.keys losing types in Typescript
export function getKeys<T>(obj: T) {
  return Object.keys(obj) as Array<keyof T>
}
