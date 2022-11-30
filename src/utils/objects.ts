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

// yolo copied from https://stackoverflow.com/questions/44134212/best-way-to-flatten-js-object-keys-and-values-to-a-single-depth-array
export function unnestObject(ob: Record<string, any>) {
  var toReturn: Record<string, string> = {}

  for (var i in ob) {
    if (!ob.hasOwnProperty(i)) continue

    if (typeof ob[i] === 'object' && ob[i] !== null) {
      var flatObject = unnestObject(ob[i])
      for (var x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue

        toReturn[i + '.' + x] = flatObject[x]
      }
    } else {
      toReturn[i] = ob[i]
    }
  }
  return toReturn
}
