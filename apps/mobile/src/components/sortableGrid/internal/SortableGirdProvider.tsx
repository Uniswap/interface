import { PropsWithChildren, useMemo } from 'react'
import {
  AutoScrollProvider,
  AutoScrollProviderProps,
} from 'src/components/sortableGrid/contexts/AutoScrollContextProvider'
import { DragContextProvider } from 'src/components/sortableGrid/contexts/DragContextProvider'
import {
  LayoutContextProvider,
  LayoutContextProviderProps,
} from 'src/components/sortableGrid/contexts/LayoutContextProvider'
import { DragContextProviderProps } from 'src/components/sortableGrid/types'

type SortableGridProviderProps<I> = PropsWithChildren<
  Omit<LayoutContextProviderProps & DragContextProviderProps<I> & AutoScrollProviderProps, 'itemKeys'>
>

export function SortableGridProvider<I>({
  children,
  data,
  numColumns,
  editable,
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
