// To work around Object.keys losing types in Typescript
// Useful for maintaining string-like Enum types when getting keys, as for SupportedChainId
// Warning: Like Object.keys(), this returns strings
export function getKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as Array<keyof T>
}

export function flattenObjectOfObjects<T>(obj: Record<string, Record<string, T>>): T[] {
  return Object.values(obj)
    .map((o) => Object.values(o))
    .flat()
}

// yolo copied from https://stackoverflow.com/questions/44134212/best-way-to-flatten-js-object-keys-and-values-to-a-single-depth-array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unnestObject(ob: Record<string, any>): Record<string, string> {
  const toReturn: Record<string, string> = {}

  for (const i in ob) {
    // `in` is safe because keys are extracted from object properties
    if (!Object.prototype.hasOwnProperty.call(ob, i)) {
      continue
    }

    if (typeof ob[i] !== 'object' || ob[i] === null) {
      toReturn[i] = ob[i]
      continue
    }

    const flatObject = unnestObject(ob[i])
    for (const x in flatObject) {
      if (!Object.prototype.hasOwnProperty.call(flatObject, x)) {
        continue
      }
      const property = flatObject[x]
      if (property === undefined) {
        continue
      }
      toReturn[i + '.' + x] = property
    }
  }

  return toReturn
}
