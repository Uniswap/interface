export const includes = <T>(
  srcStr: readonly T[] | T[],
  searchElement: any,
  fromIndex?: number | undefined,
): searchElement is T => {
  return (srcStr as any[]).includes(searchElement, fromIndex)
}
