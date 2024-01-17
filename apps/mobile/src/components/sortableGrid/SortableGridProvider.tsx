import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { TIME_TO_ACTIVATE_PAN } from './constants'
import { useAutoScroll, useStableCallback } from './hooks'
import {
  AutoScrollProps,
  ItemMeasurements,
  SortableGridChangeEvent,
  SortableGridContextType,
} from './types'

const SortableGridContext = createContext<SortableGridContextType | null>(null)

export function useSortableGridContext(): SortableGridContextType {
  const context = useContext(SortableGridContext)

  if (!context) {
    throw new Error('useSortableGridContext must be used within a SortableGridProvider')
  }

  return context
}

type SortableGridProviderProps<I> = AutoScrollProps & {
  data: I[]
  children: React.ReactNode
  activeItemScale?: number
  activeItemOpacity?: number
  activeItemShadowOpacity?: number
  editable?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  onChange: (e: SortableGridChangeEvent<I>) => void
}

export default function SortableGridProvider<I>({
  children,
  onChange,
  activeItemScale: activeItemScaleProp = 1.1,
  activeItemOpacity: activeItemOpacityProp = 0.7,
  activeItemShadowOpacity: activeItemShadowOpacityProp = 0.5,
  editable = true,
  visibleHeight,
  onDragStart,
  onDragEnd,
  scrollableRef,
  scrollY,
  data,
}: SortableGridProviderProps<I>): JSX.Element {
  const isInitialRenderRef = useRef(true)
  const prevDataRef = useRef<I[]>([])

  // Active cell settings
  const activeItemScale = useDerivedValue(() => activeItemScaleProp)
  const activeItemOpacity = useDerivedValue(() => activeItemOpacityProp)
  const activeItemShadowOpacity = useDerivedValue(() => activeItemShadowOpacityProp)

  // We have to use a state here because the activeIndex must be
  // immediately set to null when the data changes (reanimated shared value
  // updates are always delayed and can result in animation flickering)
  const [activeIndexState, setActiveIndex] = useState<number | null>(null)
  const previousActiveIndex = useSharedValue<number | null>(null)
  const gridContainerRef = useRef<View>(null)
  const touchedIndex = useSharedValue<number | null>(null)
  const activeTranslation = useSharedValue({ x: 0, y: 0 })
  const dragActivationProgress = useSharedValue(0)
  const itemAtIndexMeasurements = useSharedValue<ItemMeasurements[]>([])

  // Tells which item is currently displayed at each index
  // (e.g. the item at index 0 in the data array was moved to the index 2
  // in the displayed grid, so the render index of the item at index 2 is 0
  // (the item displayed at index 2 is the item at index 0 in the data array))
  const displayToRenderIndex = useSharedValue<number[]>(data.map((_, index) => index))

  // Tells where the item rendered at each index was moved in the displayed grid
  // (e.g. the item at index 0 in the data array was moved to the index 2
  // in the displayed grid, so the display index of the item at index 0 is 2)
  // (the reverse mapping of displayToRenderIndex)
  const renderIndexToDisplayIndex = useDerivedValue(() => {
    const result: number[] = []
    const displayToRender = displayToRenderIndex.value
    for (let i = 0; i < displayToRender.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result[displayToRender[i]!] = i
    }
    return result
  })

  // Auto scroll settings
  // Values used to scroll the container to the proper offset
  // (updated from the SortableGridInner component)
  const containerStartOffset = useSharedValue(0)
  const containerEndOffset = useSharedValue(0)
  const startScrollOffset = useSharedValue(0)
  const scrollOffsetDiff = useDerivedValue(() => scrollY.value - startScrollOffset.value)

  let activeIndex = activeIndexState
  const dataChanged =
    (!isInitialRenderRef.current && prevDataRef.current.length !== data.length) ||
    prevDataRef.current.some((item, index) => item !== data[index])
  if (dataChanged) {
    prevDataRef.current = data
    displayToRenderIndex.value = data.map((_, index) => index)
    itemAtIndexMeasurements.value = itemAtIndexMeasurements.value.slice(0, data.length)
    activeIndex = null
  }

  const isDragging = useDerivedValue(() => activeIndex !== null && touchedIndex.value !== null)

  // Automatically scrolls the container when the active item is dragged
  // out of the container bounds
  useAutoScroll(
    activeIndex,
    touchedIndex,
    itemAtIndexMeasurements,
    activeTranslation,
    scrollOffsetDiff,
    containerStartOffset,
    containerEndOffset,
    visibleHeight,
    scrollY,
    scrollableRef
  )

  const handleOrderChange = useStableCallback((fromIndex: number) => {
    const toIndex = renderIndexToDisplayIndex.value[fromIndex]
    if (toIndex === undefined || toIndex === fromIndex) {
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const newData = displayToRenderIndex.value.map((displayIndex) => data[displayIndex]!)
    onChange({ data: newData, fromIndex, toIndex })
  })

  const handleSetActiveIndex = useStableCallback((index: number | null) => {
    // Because this function is run from worklet functions with runOnJS,
    // it might be executed after the delay, when the item was released
    // so we check if the item is still being dragged before setting the
    // active index
    if ((index === null || touchedIndex.value !== null) && index !== activeIndex) {
      impactAsync(index === null ? ImpactFeedbackStyle.Light : ImpactFeedbackStyle.Medium).catch(
        () => undefined
      )
      if (index !== null) {
        onDragStart?.()
      } else {
        onDragEnd?.()
      }
      startScrollOffset.value = scrollY.value
      setActiveIndex(index)
    }
  })

  useEffect(() => {
    const prevActiveIndex = previousActiveIndex.value
    if (prevActiveIndex !== null) {
      handleOrderChange(prevActiveIndex)
      activeTranslation.value = { x: 0, y: 0 }
    }
  }, [
    activeIndex,
    previousActiveIndex,
    handleOrderChange,
    activeTranslation,
    startScrollOffset,
    scrollY,
  ])

  useEffect(() => {
    isInitialRenderRef.current = false
  }, [])

  useAnimatedReaction(
    () => ({
      isActive: activeIndex !== null,
      offsetDiff: scrollOffsetDiff.value,
    }),
    ({ isActive, offsetDiff }) => {
      if (!isActive && Math.abs(offsetDiff) > 0) {
        dragActivationProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN })
      }
    },
    [activeIndex]
  )

  const contextValue = useMemo(
    () => ({
      activeTranslation,
      gridContainerRef,
      activeIndex,
      editable,
      scrollY,
      itemAtIndexMeasurements,
      renderIndexToDisplayIndex,
      displayToRenderIndex,
      setActiveIndex: handleSetActiveIndex,
      previousActiveIndex,
      touchedIndex,
      activeItemScale,
      isDragging,
      dragActivationProgress,
      scrollOffsetDiff,
      activeItemOpacity,
      visibleHeight,
      activeItemShadowOpacity,
      containerStartOffset,
      containerEndOffset,
    }),
    [
      activeIndex,
      visibleHeight,
      activeTranslation,
      itemAtIndexMeasurements,
      dragActivationProgress,
      renderIndexToDisplayIndex,
      handleSetActiveIndex,
      displayToRenderIndex,
      editable,
      scrollY,
      isDragging,
      previousActiveIndex,
      scrollOffsetDiff,
      touchedIndex,
      activeItemScale,
      activeItemOpacity,
      activeItemShadowOpacity,
      containerStartOffset,
      containerEndOffset,
    ]
  )

  return (
    <SortableGridContext.Provider value={contextValue}>{children}</SortableGridContext.Provider>
  )
}
