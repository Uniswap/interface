// To work around Object.keys losing types in Typescript
// Useful for maintaining string-like Enum types when getting keys, as for SupportedChainId
// Warning: Like Object.keys(), this returns strings
export function getKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as Array<keyof T>
}

export function flattenObjectOfObjects<T>(
  obj:
    | Record<string, Record<string, T> | undefined>
    | Partial<Record<string, Record<string, T> | Partial<Record<string, T>>>>,
): T[] {
  return Object.values(obj)
    .filter((o): o is Record<string, T> | Partial<Record<string, T>> => o !== undefined)
    .flatMap((o) => Object.values(o))
    .filter((v): v is T => v !== undefined)
}

// yolo copied from https://stackoverflow.com/questions/44134212/best-way-to-flatten-js-object-keys-and-values-to-a-single-depth-array
// biome-ignore lint/suspicious/noExplicitAny: Generic type parameter needed for flexibility
export function unnestObject(ob: Record<string, any>): Record<string, string> {
  const toReturn: Record<string, string> = {}

  for (const i in ob) {
    // `in` is safe because keys are extracted from object properties
    if (!Object.hasOwn(ob, i)) {
      continue
    }

    if (typeof ob[i] !== 'object' || ob[i] === null) {
      toReturn[i] = ob[i]
      continue
    }

    const flatObject = unnestObject(ob[i])
    for (const x in flatObject) {
      if (!Object.hasOwn(flatObject, x)) {
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

export function getAllKeysOfNestedObject(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys = Object.keys(obj)

  if (!keys.length && prefix !== '') {
    return [prefix.slice(0, -1)]
  }

  return keys.reduce<string[]>((res, el) => {
    if (Array.isArray((obj as Record<string, unknown>)[el])) {
      return [...res]
    }

    if (typeof (obj as Record<string, unknown>)[el] === 'object' && (obj as Record<string, unknown>)[el] !== null) {
      return [
        ...res,
        ...getAllKeysOfNestedObject((obj as Record<string, unknown>)[el] as Record<string, unknown>, prefix + el + '.'),
      ]
    }

    return [...res, prefix + el]
  }, [])
}

export function sortKeysRecursively<T extends Record<string, unknown>>(input: T): T {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return input
  }

  const sortedKeys = Object.keys(input).sort()

  const sortedObj = sortedKeys.reduce((acc: Record<string, unknown>, key: string) => {
    acc[key] = sortKeysRecursively(input[key] as T)
    return acc
  }, {})

  return sortedObj as T
}
