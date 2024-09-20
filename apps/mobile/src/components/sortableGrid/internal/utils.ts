import { useCallback, useRef } from 'react'
import { Vector } from 'src/components/sortableGrid/types'

export function useStableCallback<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends (...args: Array<any>) => any,
>(callback?: C): C {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    (...args: Array<any>) => callbackRef.current?.(...args),
    [],
  ) as C
}

export const areArraysDifferent = <T>(arr1: T[], arr2: T[], areEqual = (a: T, b: T): boolean => a === b): boolean => {
  'worklet'
  return arr1.length !== arr2.length || arr1.some((item, index) => !areEqual(item, arr2[index] as T))
}

const hasProp = <O extends object, P extends string>(object: O, prop: P): object is O & Record<P, unknown> => {
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

export const getRowIndex = (index: number, numColumns: number): number => {
  'worklet'
  return Math.floor(index / numColumns)
}

export const getColumnIndex = (index: number, numColumns: number): number => {
  'worklet'
  return index % numColumns
}

export const getItemsInColumnCount = (index: number, numColumns: number, itemsCount: number): number => {
  'worklet'
  const columnIndex = getColumnIndex(index, numColumns)
  return Math.floor(itemsCount / numColumns) + (columnIndex < itemsCount % numColumns ? 1 : 0)
}

export const getItemZIndex = (
  isActive: boolean,
  pressProgress: number,
  position: Vector,
  targetPosition?: Vector,
): number => {
  'worklet'
  if (isActive) {
    return 3
  }
  if (pressProgress > 0) {
    return 2
  }
  // If the item is being re-ordered but is not dragged
  if (targetPosition && (position.x !== targetPosition.x || position.y !== targetPosition.y)) {
    return 1
  }
  return 0
}
