import React, { ComponentProps, createContext, ReactNode, useCallback, useRef } from 'react'
import { ListRenderItemInfo } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { AnimatedIndicator } from 'src/components/carousel/Indicator'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { Flex, useDeviceDimensions } from 'ui/src'

interface CarouselContextProps {
  current: number
  goToNext: () => void
  goToPrev: () => void
}

// Allows child components to control the carousel
export const CarouselContext = createContext<CarouselContextProps>({
  goToNext: () => undefined,
  goToPrev: () => undefined,
  current: 0,
})

type CarouselProps = {
  slides: JSX.Element[]
} & Pick<ComponentProps<typeof Animated.FlatList>, 'scrollEnabled'>

export function Carousel({ slides, ...flatListProps }: CarouselProps): JSX.Element {
  const scroll = useSharedValue(0)
  const { fullWidth } = useDeviceDimensions()
  const myRef = useRef<Animated.FlatList<unknown>>(null)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scroll.value = event.contentOffset.x
    },
  })

  const goToNext = useCallback(() => {
    // @ts-expect-error https://github.com/software-mansion/react-native-reanimated/issues/2976
    myRef.current?._listRef._scrollRef.scrollTo({
      x: Math.ceil(scroll.value / fullWidth + 0.5) * fullWidth,
    })
  }, [fullWidth, scroll])

  const goToPrev = useCallback(() => {
    // @ts-expect-error https://github.com/software-mansion/react-native-reanimated/issues/2976
    myRef.current?._listRef._scrollRef.scrollTo({
      x: Math.floor(scroll.value / fullWidth - 0.5) * fullWidth,
    })
  }, [fullWidth, scroll])

  return (
    <CarouselContext.Provider value={{ goToNext, goToPrev, current: 0 }}>
      <Flex grow gap="$spacing16" mb="$spacing24">
        <AnimatedIndicator scroll={scroll} stepCount={slides.length} />
        <AnimatedFlatList
          horizontal
          pagingEnabled
          data={slides}
          keyExtractor={key}
          {...flatListProps}
          ref={myRef}
          renderItem={({ item }: ListRenderItemInfo<ReactNode>): JSX.Element => (
            <Flex centered grow p="$spacing24" pt="$none" width={fullWidth}>
              {item}
            </Flex>
          )}
          scrollEnabled={true}
          scrollEventThrottle={32}
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
        />
      </Flex>
    </CarouselContext.Provider>
  )
}

const key = (_: JSX.Element, index: number): string => index.toString()
