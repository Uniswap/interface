import { BlurView } from '@react-native-community/blur'
import { useScrollToTop } from '@react-navigation/native'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet, TextInput } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { ExploreSections } from 'src/components/explore/ExploreSections'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { HandleBar } from 'src/components/modals/HandleBar'
import { IS_ANDROID, IS_IOS } from 'src/constants/globals'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { selectModalState } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { flex } from 'ui/src/theme/restyle/flex'
import { Theme } from 'ui/src/theme/restyle/theme'
import { useDebounce } from 'utilities/src/time/timing'

export function ExploreScreen(): JSX.Element {
  const modalInitialState = useAppSelector(selectModalState(ModalName.Explore)).initialState
  const navigation = useExploreStackNavigation()

  // The ExploreStack is not directly accessible from outside
  // (e.g., navigating from Home to NFTItem within ExploreStack), due to its mount within BottomSheetModal.
  // To bypass this limitation, we use an initialState to define a specific screen within ExploreStack.
  useEffect(() => {
    if (modalInitialState) {
      navigation.navigate(modalInitialState.screen, modalInitialState.params)
    }
  }, [modalInitialState, navigation])

  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery)
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const textInputRef = useRef<TextInput>(null)

  const onChangeSearchFilter = (newSearchFilter: string): void => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = (): void => {
    setIsSearchMode(true)
    sendMobileAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: SectionName.ExploreSearch,
      screen: Screens.Explore,
    })
  }

  const onSearchCancel = (): void => {
    setIsSearchMode(false)
  }

  // Handle special case with design system light colors because surface2 is the same as surface1
  const contrastBackgroundColor: keyof Theme['colors'] = isDarkMode
    ? 'DEP_backgroundOverlay'
    : 'surface2'
  const searchBarBackgroundColor: keyof Theme['colors'] = isDarkMode
    ? 'DEP_backgroundOverlay'
    : 'surface2'

  const onScroll = useCallback(() => {
    textInputRef.current?.blur()
  }, [])

  return (
    <Screen bg="none" edges={['top']}>
      <BlurredBackground isDarkMode={isDarkMode} />
      <HandleBar backgroundColor="none" />
      <Box backgroundColor="none" p="spacing16">
        <SearchTextInput
          ref={textInputRef}
          showCancelButton
          backgroundColor={isSearchMode ? contrastBackgroundColor : searchBarBackgroundColor}
          placeholder={t('Search tokens, NFTs, and wallets')}
          showShadow={!isSearchMode}
          value={searchQuery}
          onCancel={onSearchCancel}
          onChangeText={onChangeSearchFilter}
          onFocus={onSearchFocus}
        />
      </Box>
      {isSearchMode ? (
        <KeyboardAvoidingView behavior="height" style={flex.fill}>
          <Flex grow mx="spacing16">
            <VirtualizedList onScroll={onScroll}>
              <Box p="spacing4" />
              {debouncedSearchQuery.length === 0 ? (
                <SearchEmptySection />
              ) : (
                <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
                  <SearchResultsSection searchQuery={debouncedSearchQuery} />
                </AnimatedFlex>
              )}
            </VirtualizedList>
          </Flex>
        </KeyboardAvoidingView>
      ) : (
        <ExploreSections listRef={listRef} />
      )}
    </Screen>
  )
}

const BlurredBackground = memo(function BlurredBackground({ isDarkMode }: { isDarkMode: boolean }) {
  const [blurEnabled, setBlurEnabled] = useState(true)
  const overlayOpacity = useSharedValue(0)
  const navigation = useExploreStackNavigation()
  const theme = useAppTheme()

  useEffect(() => {
    if (IS_IOS) return
    return navigation.addListener('transitionStart', () => {
      overlayOpacity.value = 0.95
      setBlurEnabled(false)
    })
  }, [navigation, overlayOpacity])

  useEffect(() => {
    if (IS_IOS) return
    return navigation.addListener('transitionEnd', (e) => {
      if (!e.data.closing) {
        setBlurEnabled(true)
        overlayOpacity.value = withTiming(0, { duration: 500 })
      }
    })
  }, [navigation, overlayOpacity])

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }))

  return (
    <>
      <BlurView
        blurAmount={5}
        blurType={isDarkMode ? 'dark' : 'xlight'}
        enabled={blurEnabled}
        reducedTransparencyFallbackColor={isDarkMode ? 'sporeBlack' : 'sporeWhite'}
        style={BlurViewStyle.base}
      />
      {IS_ANDROID ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.surface1 },
            overlayStyle,
          ]}
        />
      ) : null}
    </>
  )
})

const BlurViewStyle = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
})
