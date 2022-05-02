import React, {
  ComponentProps,
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useRef,
} from 'react'
import { ListRenderItemInfo } from 'react-native'
import Animated from 'react-native-reanimated'
import { AnimatedIndicator } from 'src/components/carousel/Indicator'
import { Flex } from 'src/components/layout'
import { dimensions } from 'src/styles/sizing'

const { fullWidth } = dimensions

interface CarouselContextProps {
  current: number
  goToNext: () => void
  goToPrev: () => void
}

// Allows child components to control the carousel
export const CarouselContext = createContext<CarouselContextProps>({
  goToNext: () => {},
  goToPrev: () => {},
  current: 0,
})

type CarouselProps = {
  slides: ReactElement[]
} & Pick<ComponentProps<typeof Animated.FlatList>, 'scrollEnabled'>

export function Carousel({ slides, ...flatListProps }: CarouselProps) {
  const scrollX = useRef(new Animated.Value(0)).current

  const goToNext = useCallback(() => {}, [])

  return (
    <CarouselContext.Provider value={{ goToNext, goToPrev: goToNext, current: 0 }}>
      <Flex grow mb="lg">
        <AnimatedIndicator scrollX={scrollX} stepCount={slides.length} />
        <Animated.FlatList
          horizontal
          pagingEnabled
          data={slides}
          keyExtractor={key}
          {...flatListProps}
          renderItem={({ item }: ListRenderItemInfo<ReactNode>) => (
            <Flex centered grow p="lg" width={fullWidth}>
              {item}
            </Flex>
          )}
          scrollEventThrottle={32}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
        />
      </Flex>
    </CarouselContext.Provider>
  )
}

const key = (_: ReactElement, index: number) => index.toString()
