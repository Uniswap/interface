import { FlatList, ScrollView } from 'react-native'

const hasProp = <O extends object, P extends string>(
  object: O,
  prop: P
): object is O & Record<P, unknown> => {
  return prop in object
}

export const defaultKeyExtractor = <I>(item: I, index: number): string => {
  if (typeof item === 'string') {
    return item
  }

  if (typeof item === 'object' && item !== null) {
    if (hasProp(item, 'id')) {
      return String(item.id)
    }
    if (hasProp(item, 'key')) {
      return String(item.key)
    }
  }

  return String(index)
}

export const isScrollView = (scrollable: ScrollView | FlatList): scrollable is ScrollView => {
  return 'scrollTo' in scrollable
}
