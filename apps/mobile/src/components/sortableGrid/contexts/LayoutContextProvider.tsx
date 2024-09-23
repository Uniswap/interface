import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef } from 'react'
import {
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { ITEM_ANIMATION_DURATION, OFFSET_EPS } from 'src/components/sortableGrid/constants'
import { Dimensions, Vector } from 'src/components/sortableGrid/types'
import { areArraysDifferent, getColumnIndex, getRowIndex } from 'src/components/sortableGrid/utils'

const EMPTY_ARRAY: unknown[] = []
const EMPTY_OBJECT = {}

export type LayoutContextType = {
  // HELPER VALUES
  initialRenderCompleted: SharedValue<boolean>
  measuredItemsCount: SharedValue<number>
  // DIMENSIONS
  rowOffsets: SharedValue<number[]>
  itemDimensions: SharedValue<Record<string, Dimensions>>
  containerWidth: SharedValue<number>
  containerHeight: SharedValue<number>
  targetContainerHeight: SharedValue<number>
  appliedContainerHeight: SharedValue<number>
  columnWidth: SharedValue<number>
  // KEY-INDEX MAPPINGS
  keyToIndex: SharedValue<Record<string, number>>
  indexToKey: SharedValue<string[]>
  // POSITIONING
  itemPositions: SharedValue<Record<string, Vector>>
}

const LayoutContext = createContext<LayoutContextType | null>(null)

export function useLayoutContext(): LayoutContextType {
  const context = useContext(LayoutContext)

  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutContextProvider')
  }

  return context
}

export type LayoutContextProviderProps = PropsWithChildren<{
  itemKeys: string[]
  numColumns: number
  animateContainerHeight?: boolean
}>

export function LayoutContextProvider({
  itemKeys,
  numColumns,
  animateContainerHeight = true,
  children,
}: LayoutContextProviderProps): JSX.Element {
  /**
   * VARIABLES
   */
  // HELPER VALUES
  const prevKeysRef = useRef<string[]>([])
  const rowsCount = Math.ceil(itemKeys.length / numColumns)
  const initialRenderCompleted = useSharedValue(false)
  const appliedContainerHeight = useSharedValue(-1)
  const measuredItemsCount = useSharedValue(0)

  // DIMENSIONS
  const rowOffsets = useSharedValue<number[]>([])
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({})
  const containerWidth = useSharedValue(-1)
  const containerHeight = useSharedValue(-1)
  const targetContainerHeight = useSharedValue(-1)
  const columnWidth = useDerivedValue(() => (containerWidth.value === -1 ? -1 : containerWidth.value / numColumns))

  // KEY-INDEX MAPPINGS
  const indexToKey = useSharedValue<string[]>([])
  const keyToIndex = useDerivedValue(() => Object.fromEntries(indexToKey.value.map((key, index) => [key, index])))

  // POSITIONING
  const itemPositions = useDerivedValue<Record<string, Vector>>(() => {
    // Return empty object if columnWidth is not yet calculated or if the number
    // of rows is not yet known
    if (columnWidth.value === -1 || rowOffsets.value.length < rowsCount) {
      return EMPTY_OBJECT
    }
    // Calculate item positions based on their order in the grid
    return Object.fromEntries(
      Object.entries(indexToKey.value).map(([index, key]) => [
        key,
        {
          x: columnWidth.value * getColumnIndex(parseInt(index, 10), numColumns),
          y: rowOffsets.value[getRowIndex(parseInt(index, 10), numColumns)] ?? 0,
        },
      ]),
    )
  }, [rowsCount, columnWidth, rowOffsets, indexToKey, numColumns])

  /**
   * EFFECTS
   */
  // Update indexToKey when itemKeys change (only if the arrays are different in
  // terms of their elements, not just their references - this prevents unnecessary
  // value updates if the array is the new object but has all the same contents)
  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys
      prevKeysRef.current = itemKeys
    }
  }, [itemKeys, indexToKey])

  // ITEM DIMENSIONS UPDATER
  useAnimatedReaction(
    () => measuredItemsCount.value,
    (count) => {
      // Re-create the item dimensions object if all items have been measured
      // (this is done to prevent unnecessary object updates after each item measurement)
      if (count === itemKeys.length) {
        itemDimensions.value = { ...itemDimensions.value }
      }
    },
    [itemKeys],
  )

  // ROW OFFSETS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value,
    }),
    ({ dimensions, idxToKey }) => {
      // Return an empty array if items haven't been measured yet
      if (Object.keys(dimensions).length === 0) {
        return EMPTY_ARRAY
      }
      const offsets = [0]
      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex, 10), numColumns)
        offsets[rowIndex + 1] = Math.max(
          offsets[rowIndex + 1] ?? 0,
          (offsets[rowIndex] ?? 0) + (dimensions[key]?.height ?? 0),
        )
      }
      // Update row offsets only if they have changed
      if (areArraysDifferent(offsets, rowOffsets.value, (a, b) => Math.abs(a - b) < OFFSET_EPS)) {
        if (!rowOffsets.value.length) {
          initialRenderCompleted.value = true
        }
        rowOffsets.value = offsets
      }
    },
    [numColumns],
  )

  useAnimatedReaction(
    () => rowOffsets.value,
    (offsets) => {
      const newHeight = offsets[offsets.length - 1] ?? -1
      targetContainerHeight.value = newHeight

      if (newHeight === -1) {
        return
      }

      const duration = animateContainerHeight ? ITEM_ANIMATION_DURATION : 0
      // If container is expanded, animate its height immediately
      if (newHeight > containerHeight.value) {
        containerHeight.value = withTiming(newHeight, { duration })
      }
      // If container is shrunk, delay the animation to allow the items to disappear
      else if (newHeight < containerHeight.value) {
        const delay = (animateContainerHeight ? 0.25 : 1) * ITEM_ANIMATION_DURATION
        containerHeight.value = withDelay(delay, withTiming(newHeight, { duration }))
      }
      // In all other
      else {
        containerHeight.value = newHeight
      }
    },
    [animateContainerHeight],
  )

  /**
   * CONTEXT VALUE
   */
  const contextValue = useMemo<LayoutContextType>(
    () => ({
      initialRenderCompleted,
      appliedContainerHeight,
      measuredItemsCount,
      rowOffsets,
      itemDimensions,
      containerWidth,
      containerHeight,
      targetContainerHeight,
      columnWidth,
      keyToIndex,
      indexToKey,
      itemPositions,
    }),
    [
      initialRenderCompleted,
      appliedContainerHeight,
      measuredItemsCount,
      rowOffsets,
      itemDimensions,
      containerWidth,
      containerHeight,
      targetContainerHeight,
      columnWidth,
      keyToIndex,
      indexToKey,
      itemPositions,
    ],
  )

  return <LayoutContext.Provider value={contextValue}>{children}</LayoutContext.Provider>
}
