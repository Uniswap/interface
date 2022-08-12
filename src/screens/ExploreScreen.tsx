import { useScrollToTop } from '@react-navigation/native'
import { BlurView } from 'expo-blur'
import React, { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextInput, useColorScheme, ViewStyle } from 'react-native'
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
import { useAppSelector } from 'src/app/hooks'
import { FavoriteTokensCard } from 'src/components/explore/FavoriteTokensCard'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { TopTokensCard } from 'src/components/explore/TopTokensCard'
import { WatchedWalletsCard } from 'src/components/explore/WatchedWalletsCard'
import { AppBackground } from 'src/components/gradients/AppBackground'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { AnimatedText } from 'src/components/Text'
import { ClientSideOrderBy } from 'src/features/dataApi/coingecko/types'
import { selectHasFavoriteTokens, selectHasWatchedWallets } from 'src/features/favorites/selectors'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// For content Y offset since Header has abolute position
const SEARCH_BAR_HEIGHT = 48
const HEADER_HEIGHT =
  theme.textVariants.headlineSmall.lineHeight +
  theme.spacing.lg +
  SEARCH_BAR_HEIGHT +
  theme.spacing.xl
const CONTENT_MAX_SCROLL_Y = SEARCH_BAR_HEIGHT + theme.spacing.xl // Scroll distance for pinned search bar state

export function ExploreScreen() {
  const { t } = useTranslation()

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const insets = useSafeAreaInsets()
  const isDarkMode = useColorScheme() === 'dark'

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const scrollY = useSharedValue(0)
  const textInputRef = useRef<TextInput>(null)

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
        <Flex gap="lg" mb="sm" mt="xl" mx="sm">
          <AnimatedText mx="xs" style={titleStyle} variant="headlineSmall">
            {t('Explore')}
          </AnimatedText>
          <SearchTextInput
            ref={textInputRef}
            backgroundColor="backgroundContainer"
            placeholder={t('Search tokens or addresses')}
            value={searchQuery}
            onCancel={onSearchCancel}
            onChangeText={onChangeSearchFilter}
            onFocus={onSearchFocus}
          />
        </Flex>
      </AnimatedBlurView>

      {isSearchMode ? (
        <KeyboardAvoidingView behavior="height" style={flex.fill}>
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} px="sm">
            <VirtualizedList>
              <Box height={CONTENT_MAX_SCROLL_Y} mb="md" />
              <SearchResultsSection searchQuery={searchQuery} />
            </VirtualizedList>
          </AnimatedFlex>
        </KeyboardAvoidingView>
      ) : (
        <VirtualizedList ref={listRef} onScroll={scrollHandler}>
          <Box height={HEADER_HEIGHT} mb="md" />
          <Flex gap="sm" pb="lg" px="sm">
            <CardSections textInputRef={textInputRef} />
          </Flex>
        </VirtualizedList>
      )}
    </Screen>
  )
}

type CardSectionsProps = {
  textInputRef: React.RefObject<TextInput>
}
const CardSections = ({ textInputRef }: CardSectionsProps) => {
  const hasWatchedWallets = useAppSelector(selectHasWatchedWallets)
  const hasFavoriteTokens = useAppSelector(selectHasFavoriteTokens)
  // Adding 'weight' to card sections depending on if they are empty or not
  // Order will go watchedWallets > favoriteTokens > topTokens
  const cardSections = useMemo(() => {
    const SORT_SHOW_FIRST = 0
    const SORT_SHOW_LAST = 1
    const sections = [
      {
        order: hasWatchedWallets ? SORT_SHOW_FIRST : SORT_SHOW_LAST,
        section: (
          <WatchedWalletsCard
            onSearchWallets={() => {
              textInputRef.current?.focus()
            }}
          />
        ),
      },
      {
        order: hasFavoriteTokens ? SORT_SHOW_FIRST : SORT_SHOW_LAST,
        section: (
          <FavoriteTokensCard
            fixedCount={5}
            metadataDisplayType={ClientSideOrderBy.PriceChangePercentage24hDesc}
          />
        ),
      },
      {
        order: SORT_SHOW_FIRST,
        section: (
          <TopTokensCard
            fixedCount={15}
            metadataDisplayType={ClientSideOrderBy.PriceChangePercentage24hDesc}
          />
        ),
      },
    ]
    return sections.sort((a, b) => a.order - b.order).map(({ section }) => section)
  }, [textInputRef, hasWatchedWallets, hasFavoriteTokens])

  return (
    <Flex gap="sm" pb="lg">
      {cardSections.map((card, i) => (
        <AnimatedFlex key={i} entering={FadeIn} exiting={FadeOut}>
          {card}
        </AnimatedFlex>
      ))}
    </Flex>
  )
}

const BlurHeaderStyle: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  zIndex: 10,
}
