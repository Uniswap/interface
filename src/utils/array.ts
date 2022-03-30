function onlyUnique<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index
}

export function unique(array: any[], isUnique: typeof onlyUnique = onlyUnique) {
  return array.filter(isUnique)
}
