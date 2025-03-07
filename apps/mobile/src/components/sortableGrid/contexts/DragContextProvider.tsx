import { createContext, useContext, useMemo } from 'react'
import { runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { useLayoutContext } from 'src/components/sortableGrid/contexts/LayoutContextProvider'
import { useStableCallback } from 'src/components/sortableGrid/internal/utils'
import { DragContextProviderProps, DragContextType, Vector } from 'src/components/sortableGrid/types'

const DragContext = createContext<DragContextType | null>(null)

export function useDragContext(): DragContextType {
  const context = useContext(DragContext)

  if (!context) {
    throw new Error('useDragContext must be used within a DragContextProvider')
  }

  return context
}

export function DragContextProvider<I>({
  data,
  itemKeys,
  editable = true,
  activeItemScale: activeItemScaleProp = 1.1,
  activeItemOpacity: activeItemOpacityProp = 0.7,
  activeItemShadowOpacity: activeItemShadowOpacityProp = 0.5,
  onDragStart,
  onDrop,
  onChange,
  keyExtractor,
  children,
}: DragContextProviderProps<I>): JSX.Element {
  const { keyToIndex } = useLayoutContext()
  /**
   * VARIABLES
   */
  // ACTIVE ITEM
  const activeItemKey = useSharedValue<string | null>(null)
  const prevActiveItemKey = useSharedValue<string | null>(null)
  const activeItemDropped = useSharedValue(false)

  // DRAG ACTIVATION
  const activationProgress = useSharedValue(0)
  const activeItemPosition = useSharedValue<Vector>({ x: 0, y: 0 })

  // ACTIVE ITEM DECORATION
  const activeItemScale = useDerivedValue(() => activeItemScaleProp)
  const activeItemOpacity = useDerivedValue(() => activeItemOpacityProp)
  const activeItemShadowOpacity = useDerivedValue(() => activeItemShadowOpacityProp)

  /**
   * HANDLERS
   */
  const handleDragStart = useStableCallback(async (key: string, keyToIdx: Record<string, number>) => {
    const index = keyToIdx[key]
    if (index === undefined) {
      return
    }
    const item = data[index]
    if (!onDragStart || !item) {
      return
    }
    onDragStart({ index, item })
  })

  const handleDrop = useStableCallback((key: string, keyToIdx: Record<string, number>) => {
    const index = keyToIdx[key]
    if (index === undefined) {
      return
    }
    const item = data[index]
    if (!onDrop || index === undefined || !item) {
      return
    }
    onDrop({ index, item })
  })

  const handleChange = useStableCallback(async (swappedKey: string, keyToIdx: Record<string, number>) => {
    if (!onChange) {
      return
    }
    const toIndex = keyToIdx[swappedKey]
    if (toIndex === undefined) {
      return
    }
    const fromIndex = itemKeys.indexOf(swappedKey)

    const reorderedData: I[] = []

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      if (!item) {
        return
      }
      const itemKey = keyExtractor(item, i)
      const index = keyToIdx[itemKey]
      if (index === undefined) {
        return
      }
      reorderedData[index] = item
    }

    onChange({ data: reorderedData, fromIndex, toIndex })
  })

  /**
   * REACTIONS
   */
  // Handle drag start and order change (on drag end)
  useAnimatedReaction(
    () => activeItemKey.value,
    (key, prevKey) => {
      if (key !== null && prevKey === null) {
        runOnJS(handleDragStart)(key, keyToIndex.value)
      } else if (key === null && prevKey !== null) {
        runOnJS(handleChange)(prevKey, keyToIndex.value)
      }

      if (key !== null) {
        prevActiveItemKey.value = key
      }
    },
    [handleDragStart, handleChange],
  )

  // Handle drop (after animation of the active item is finished
  // and the item is dropped in the new position)
  useAnimatedReaction(
    () => activeItemDropped.value,
    (dropped) => {
      if (dropped && prevActiveItemKey.value !== null) {
        runOnJS(handleDrop)(prevActiveItemKey.value, keyToIndex.value)
      }
    },
    [handleDrop],
  )

  /**
   * CONTEXT VALUE
   */
  const contextValue = useMemo(
    () => ({
      editable,
      activeItemKey,
      activeItemDropped,
      activationProgress,
      activeItemPosition,
      activeItemScale,
      activeItemOpacity,
      activeItemShadowOpacity,
    }),
    [
      editable,
      activeItemKey,
      activeItemDropped,
      activationProgress,
      activeItemPosition,
      activeItemScale,
      activeItemOpacity,
      activeItemShadowOpacity,
    ],
  )

  return <DragContext.Provider value={contextValue}>{children}</DragContext.Provider>
}
