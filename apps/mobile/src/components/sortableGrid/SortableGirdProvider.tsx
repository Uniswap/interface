import { PropsWithChildren, useMemo } from 'react'
import type {
  AutoScrollProviderProps,
  DragContextProviderProps,
  LayoutContextProviderProps,
} from 'src/components/sortableGrid/contexts'
import { AutoScrollProvider, DragContextProvider, LayoutContextProvider } from 'src/components/sortableGrid/contexts'

type SortableGridProviderProps<I> = PropsWithChildren<
  Omit<LayoutContextProviderProps & DragContextProviderProps<I> & AutoScrollProviderProps, 'itemKeys'>
>

export function SortableGridProvider<I>({
  children,
  data,
  numColumns,
  editable,
  hapticFeedback,
  animateContainerHeight,
  activeItemScale,
  activeItemOpacity,
  activeItemShadowOpacity,
  scrollableRef,
  visibleHeight,
  scrollY,
  onChange,
  onDragStart,
  onDrop,
  keyExtractor,
}: SortableGridProviderProps<I>): JSX.Element {
  const itemKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor])

  const sharedProps = {
    itemKeys,
    numColumns,
  }

  return (
    <LayoutContextProvider {...sharedProps} animateContainerHeight={animateContainerHeight}>
      <DragContextProvider
        {...sharedProps}
        activeItemOpacity={activeItemOpacity}
        activeItemScale={activeItemScale}
        activeItemShadowOpacity={activeItemShadowOpacity}
        data={data}
        editable={editable}
        hapticFeedback={hapticFeedback}
        keyExtractor={keyExtractor}
        onChange={onChange}
        onDragStart={onDragStart}
        onDrop={onDrop}
      >
        <AutoScrollProvider scrollY={scrollY} scrollableRef={scrollableRef} visibleHeight={visibleHeight}>
          {children}
        </AutoScrollProvider>
      </DragContextProvider>
    </LayoutContextProvider>
  )
}
