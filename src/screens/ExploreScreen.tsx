import { BlurView } from 'expo-blur'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme, ViewStyle } from 'react-native'
import Animated, {
  Extrapolate,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FavoriteTokensSection } from 'src/components/explore/FavoriteTokensSection'
import { SearchResultsSection } from 'src/components/explore/SearchResultsSection'
import { TopTokensSection } from 'src/components/explore/TopTokensSection'
import { AppBackground } from 'src/components/gradients'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { AnimatedText } from 'src/components/Text'
import { ClientSideOrderBy } from 'src/features/dataApi/coingecko/types'
import { theme } from 'src/styles/theme'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// For content Y offset since Header has abolute position
const SEARCH_BAR_HEIGHT = 48
const HEADER_HEIGHT =
  theme.textVariants.headlineSmall.lineHeight +
  theme.spacing.lg +
  SEARCH_BAR_HEIGHT +
  theme.spacing.sm * 2
const CONTENT_MAX_SCROLL_Y = SEARCH_BAR_HEIGHT + theme.spacing.sm // Scroll distance for pinned search bar state

export function ExploreScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const isDarkMode = useColorScheme() === 'dark'

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const scrollY = useSharedValue(0)

  const onChangeSearchFilter = (newSearchFilter: string) => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = () => {
    scrollY.value = withTiming(CONTENT_MAX_SCROLL_Y, {
      duration: 100,
    })
    setIsSearchMode(true)
  }

  const onSearchCancel = () => {
    scrollY.value = withTiming(0, { duration: 100 })
    setIsSearchMode(false)
  }

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, CONTENT_MAX_SCROLL_Y],
            [0, -CONTENT_MAX_SCROLL_Y],
            Extrapolate.CLAMP
          ),
        },
      ],
    }
  })

  const blurViewProps = useAnimatedProps(() => {
    return {
      intensity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [1, 90], Extrapolate.CLAMP),
    }
  })

  const titleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [1, 0], Extrapolate.CLAMP),
    }
  })

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppBackground />
      <AnimatedBlurView
        animatedProps={blurViewProps}
        intensity={0}
        style={[
          headerStyle,
          BlurHeaderStyle,
          {
            paddingTop: insets.top,
          },
        ]}
        tint={isDarkMode ? 'dark' : 'default'}>
        <Flex gap="lg" mb="sm" mt="lg" mx="md">
          <AnimatedText mx="xs" style={titleStyle} variant="headlineSmall">
            {t('Explore')}
          </AnimatedText>
          <SearchTextInput
            backgroundColor="backgroundBackdrop"
            placeholder={t('Search tokens, ENS, or addresses')}
            value={searchQuery}
            onCancel={onSearchCancel}
            onChangeText={onChangeSearchFilter}
            onFocus={onSearchFocus}
          />
        </Flex>
      </AnimatedBlurView>

      {isSearchMode ? (
        <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} px="md">
          <VirtualizedList>
            <Box height={SEARCH_BAR_HEIGHT + theme.spacing.sm * 2} mb="md" />
            <SearchResultsSection searchQuery={searchQuery} />
          </VirtualizedList>
        </AnimatedFlex>
      ) : (
        <VirtualizedList onScroll={scrollHandler}>
          <Box height={HEADER_HEIGHT} mb="md" />
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="md">
            <FavoriteTokensSection
              fixedCount={5}
              metadataDisplayType={ClientSideOrderBy.PriceChangePercentage24hDesc}
            />
          </AnimatedFlex>
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} mb="lg" mx="md">
            <TopTokensSection
              fixedCount={15}
              metadataDisplayType={ClientSideOrderBy.PriceChangePercentage24hDesc}
            />
          </AnimatedFlex>
        </VirtualizedList>
      )}
    </Screen>
  )
}

const BlurHeaderStyle: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  zIndex: 10,
}
