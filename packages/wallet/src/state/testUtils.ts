export const getAllKeysOfNestedObject = (obj: Record<string, unknown>, prefix = ''): string[] => {
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
