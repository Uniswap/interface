import { useScrollToTop } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { graphql } from 'babel-plugin-relay/macro'
import { BlurView } from 'expo-blur'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { ExploreStackParamList, TabNavigationProp } from 'src/app/navigation/types'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { FavoriteTokensCard } from 'src/components/explore/FavoriteTokensCard'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { SearchEmptySection_popularTokens$key } from 'src/components/explore/search/__generated__/SearchEmptySection_popularTokens.graphql'
import { TopTokensCard } from 'src/components/explore/TopTokensCard'
import { WatchedWalletsCard } from 'src/components/explore/WatchedWalletsCard'
import { AppBackground } from 'src/components/gradients/AppBackground'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { ClientSideOrderBy } from 'src/features/dataApi/coingecko/types'
import { Screens, Tabs } from 'src/screens/Screens'
import { ExploreScreenQuery$data } from 'src/screens/__generated__/ExploreScreenQuery.graphql'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'
import { useDebounce } from 'src/utils/timing'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// For content Y offset since Header has abolute position
const SEARCH_BAR_HEIGHT = 66
const HEADER_HEIGHT =
  theme.textVariants.headlineSmall.lineHeight +
  theme.spacing.xxxs +
  SEARCH_BAR_HEIGHT +
  theme.spacing.xl
const CONTENT_MAX_SCROLL_Y = SEARCH_BAR_HEIGHT + theme.spacing.md // Scroll distance for pinned search bar state

export const exploreScreenQuery = graphql`
  query ExploreScreenQuery {
    popularTokens: topTokenProjects(orderBy: VOLUME, page: 1, pageSize: 3) {
      ...SearchEmptySection_popularTokens
    }
  }
`

type Props = { data: ExploreScreenQuery$data } & NativeStackScreenProps<
  ExploreStackParamList,
  Screens.Explore
>

export function ExploreScreen({ data, navigation }: Props) {
  const { t } = useTranslation()

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const insets = useSafeAreaInsets()
  const isDarkMode = useColorScheme() === 'dark'

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery)
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

  const onSearchCancel = useCallback(() => {
    scrollY.value = withTiming(0, { duration: 100 })
    setIsSearchMode(false)
  }, [scrollY])

  // Reset search mode on tab press
  useEffect(() => {
    const unsubscribe = (navigation.getParent() as TabNavigationProp<Tabs.Explore>).addListener(
      'tabPress',
      () => {
        textInputRef?.current?.clear()
        onSearchCancel()
      }
    )

    return unsubscribe
  }, [navigation, onSearchCancel])

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })

  const resultsScrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y + CONTENT_MAX_SCROLL_Y
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
      intensity: interpolate(
        scrollY.value,
        [CONTENT_MAX_SCROLL_Y, CONTENT_MAX_SCROLL_Y * 1.25],
        [0, 90],
        Extrapolate.CLAMP
      ),
    }
  })

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppBackground />
      <AnimatedBlurView
        animatedProps={blurViewProps}
        intensity={0}
        style={[
          ...(!isSearchMode ? [headerStyle] : []),
          BlurHeaderStyle,
          {
            paddingTop: insets.top,
          },
        ]}
        tint={isDarkMode ? 'dark' : 'default'}>
        <Flex gap={isSearchMode ? 'none' : 'lg'}>
          <Flex height={isSearchMode ? 0 : 'auto'} opacity={isSearchMode ? 0 : 1}>
            <AccountHeader />
          </Flex>
          <Flex m="sm">
            <SearchTextInput
              ref={textInputRef}
              showCancelButton
              backgroundColor="backgroundContainer"
              placeholder={t('Search tokens or addresses')}
              value={searchQuery}
              onCancel={onSearchCancel}
              onChangeText={onChangeSearchFilter}
              onFocus={onSearchFocus}
            />
          </Flex>
        </Flex>
      </AnimatedBlurView>
      {isSearchMode ? (
        <KeyboardAvoidingView behavior="height" style={flex.fill}>
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} px="sm">
            <VirtualizedList onScroll={resultsScrollHandler}>
              <Box height={CONTENT_MAX_SCROLL_Y} mb="sm" />
              {searchQuery.length === 0 ? (
                <SearchEmptySection
                  popularTokens={
                    data.popularTokens
                      ? (data.popularTokens.filter(Boolean) as SearchEmptySection_popularTokens$key)
                      : null
                  }
                />
              ) : (
                <SearchResultsSection searchQuery={debouncedSearchQuery} />
              )}
            </VirtualizedList>
          </AnimatedFlex>
        </KeyboardAvoidingView>
      ) : (
        <VirtualizedList ref={listRef} onScroll={scrollHandler}>
          <Box height={HEADER_HEIGHT} mb="md" />
          <Flex gap="sm" px="sm">
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
  // Adding 'weight' to card sections depending on if they are empty or not
  // Order will go watchedWallets > favoriteTokens > topTokens
  const cardSections = useMemo(() => {
    const SORT_SHOW_FIRST = 0
    const sections = [
      {
        order: SORT_SHOW_FIRST,
        section: (
          <WatchedWalletsCard
            onSearchWallets={() => {
              textInputRef.current?.focus()
            }}
          />
        ),
      },
      {
        order: SORT_SHOW_FIRST,
        section: (
          <FavoriteTokensCard
            fixedCount={5}
            metadataDisplayType={ClientSideOrderBy.PriceChangePercentage24hDesc}
          />
        ),
      },
      {
        order: SORT_SHOW_FIRST,
        section: <TopTokensCard />,
      },
    ]
    return sections.sort((a, b) => a.order - b.order).map(({ section }) => section)
  }, [textInputRef])

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
