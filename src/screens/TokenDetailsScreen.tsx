import { useScrollToTop } from '@react-navigation/native'
import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme, ViewStyle } from 'react-native'
import {
  Extrapolate,
  FadeIn,
  FadeOut,
  interpolate,
  processColor,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { Button, ButtonEmphasis, ButtonSize, ButtonState } from 'src/components-uds/Button/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Heart } from 'src/components/icons/Heart'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { AnimatedBlurView, BlurHeaderStyle } from 'src/components/layout/screens/HeaderScrollScreen'
import { WithScrollToTop } from 'src/components/layout/screens/WithScrollToTop'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { CurrencyPriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { TokenL1Balance } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsBackButtonRow } from 'src/components/TokenDetails/TokenDetailsBackButtonRow'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import TokenWarningCard from 'src/components/tokens/TokenWarningCard'
import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import { AssetType } from 'src/entities/assets'
import { useSingleBalance } from 'src/features/dataApi/balances'
import { useSpotPrices } from 'src/features/dataApi/prices'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { TokenWarningLevel, useTokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
import { currencyAddress, currencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

const FooterPositionStyle: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 10,
}
interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId(currency))
  const onFavoritePress = useToggleFavoriteCallback(currencyId(currency))

  const initialSendState = useMemo((): TransactionState => {
    return {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      [CurrencyField.INPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
  }, [currency])

  return (
    <Flex row justifyContent="space-between" mx="md">
      <Flex centered row gap="xs">
        <CurrencyLogo currency={currency} size={36} />
        <Box>
          <Text variant="headlineSmall">{currency.name ?? t('Unknown token')}</Text>
          <Text color="textTertiary" variant="caption">
            {currency.symbol ?? t('Unknown token')}
          </Text>
        </Box>
      </Flex>
      <Flex centered row gap="none">
        <SendButton
          iconOnly
          bg="none"
          iconColor="textPrimary"
          iconSize={24}
          initialState={initialSendState}
        />
        <IconButton
          icon={<Heart active={isFavoriteToken} size={24} />}
          px="none"
          variant="transparent"
          onPress={onFavoritePress}
        />
      </Flex>
    </Flex>
  )
}

function HeaderTitleElement({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  const currencies = useMemo(() => [currency], [currency])

  const { loading, spotPrices } = useSpotPrices(currencies)

  return (
    <Flex centered gap="none">
      <Flex centered row gap="xs">
        <CurrencyLogo currency={currency} size={16} />
        <Text variant="subhead">{currency.name ?? t('Unknown token')}</Text>
      </Flex>
      {loading ? null : (
        <Text color="textSecondary" variant="caption">
          {formatUSDPrice(spotPrices[currencyId(currency)]?.price) ?? t('Unknown token')}
        </Text>
      )}
    </Flex>
  )
}

enum SwapType {
  BUY,
  SELL,
}

const CONTENT_MAX_SCROLL_Y = 75

export function TokenDetailsScreen({ route }: AppStackScreenProp<Screens.TokenDetails>) {
  const { currencyId: _currencyId } = route.params

  const currency = useCurrency(_currencyId)

  if (!currency) return null
  return <TokenDetails currency={currency} />
}

function TokenDetails({ currency }: { currency: Currency }) {
  const balance = useSingleBalance(currency)

  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const { tokenWarningLevel, tokenWarningDismissed, warningDismissCallback } = useTokenWarningLevel(
    currency.wrapped
  )

  // set if attempting buy or sell, use for warning modal
  const [activeSwapAttemptType, setActiveSwapAttemptType] = useState<SwapType | undefined>(
    undefined
  )

  const navigateToSwapBuy = useCallback(() => {
    setActiveSwapAttemptType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currency, dispatch])

  const navigateToSwapSell = useCallback(() => {
    setActiveSwapAttemptType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currency, dispatch])

  const onPressSwap = useCallback(
    (swapType: SwapType) => {
      // show warning modal speedbump if token has a warning level and user has not dismissed
      if (tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed) {
        setActiveSwapAttemptType(swapType)
      } else {
        if (swapType === SwapType.BUY) {
          navigateToSwapBuy()
        }
        if (swapType === SwapType.SELL) {
          navigateToSwapSell()
        }
        return
      }
    },
    [navigateToSwapBuy, navigateToSwapSell, tokenWarningDismissed, tokenWarningLevel]
  )

  // copy HeaderScrollScreen behavior and add fixed footer on scroll and disappearing children on scroll
  const listRef = useRef(null)
  useScrollToTop(listRef)

  const isDarkMode = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  // On scroll, ListContentHeader fades out and FixedHeaderBar fades in
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(
        event.contentOffset.y > CONTENT_MAX_SCROLL_Y / 2 ? CONTENT_MAX_SCROLL_Y : 0
      )
    },
  })

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [0, 1], Extrapolate.CLAMP),
      zIndex: scrollY.value === 0 ? -1 : 10,
      // need zIndex at -1 if unscrolled otherwise the ContentHeader buttons are not clickable
    }
  })

  const footerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y / 2], [0, 1], Extrapolate.CLAMP),
    }
  })

  const blurViewProps = useAnimatedProps(() => {
    return {
      pointerEvents: (scrollY.value === 0 ? 'none' : 'auto') as 'none' | 'auto',
    }
  })

  const contentHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [1, 0], Extrapolate.CLAMP),
    }
  })

  // TODO: make this feel smoother, somehow add exiting={FadeOut} animation to component
  const disappearingChildStyle = useAnimatedStyle(() => {
    return {
      overflow: 'hidden',
      maxHeight: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [200, 0], Extrapolate.CLAMP),
    }
  })

  const bottomButtonStyle = useAnimatedStyle(() => {
    'worklet'
    // had to manually define backgroundSurface as an rgba value for this to run on UI thread
    const opacity = interpolate(
      scrollY.value,
      [0, CONTENT_MAX_SCROLL_Y / 2],
      [0, 100],
      Extrapolate.CLAMP
    )
    return { backgroundColor: processColor(`rgba(14, 17, 26, ${opacity})`) }
  })

  const ContentHeader = useMemo(
    () => (
      <AnimatedFlex mx="md" style={contentHeaderStyle}>
        <TokenDetailsBackButtonRow currency={currency} />
      </AnimatedFlex>
    ),
    [currency, contentHeaderStyle]
  )

  const FixedHeaderBar = useMemo(
    () => (
      <AnimatedBlurView
        animatedProps={blurViewProps}
        intensity={95}
        style={[
          BlurHeaderStyle,
          headerStyle,
          {
            paddingTop: insets.top,
          },
        ]}
        tint={isDarkMode ? 'dark' : 'default'}>
        <WithScrollToTop ref={listRef}>
          <Box mx="md" my="sm">
            <BackHeader>
              <HeaderTitleElement currency={currency} />
            </BackHeader>
          </Box>
        </WithScrollToTop>
      </AnimatedBlurView>
    ),
    [blurViewProps, currency, headerStyle, insets.top, isDarkMode]
  )

  const FixedFooterBar = useMemo(
    () => (
      // TODO: add blur here
      <AnimatedFlex
        animatedProps={blurViewProps}
        style={[footerStyle, FooterPositionStyle]}
        tint={isDarkMode ? 'dark' : 'default'}>
        {balance && (
          <Flex
            bg="backgroundSurface"
            borderColor="backgroundContainer"
            borderTopLeftRadius="xl"
            borderTopRightRadius="xl"
            borderWidth={1}
            gap="lg"
            px="sm"
            py="xs"
            width={dimensions.fullWidth}>
            <TokenL1Balance balance={balance} />
          </Flex>
        )}
      </AnimatedFlex>
    ),
    [blurViewProps, balance, footerStyle, isDarkMode]
  )

  const disappearOnScroll = useMemo(
    () => (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} style={disappearingChildStyle}>
        {balance && (
          <Flex gap="lg" pb="xs" px="sm" width={dimensions.fullWidth}>
            <TokenL1Balance balance={balance} />
          </Flex>
        )}
      </AnimatedFlex>
    ),
    [disappearingChildStyle, balance]
  )

  return (
    <>
      <Screen edges={['top', 'left', 'right']}>
        {/* Fixed header that appears on scroll */}
        {FixedHeaderBar}
        {/* ScrollView content */}
        <VirtualizedList
          ref={listRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}>
          {ContentHeader}
          <Flex gap="md" my="md">
            <TokenDetailsHeader currency={currency} />
            <CurrencyPriceChart currency={currency} />
            {disappearOnScroll}
            <TokenDetailsStats currency={currency} />
            {tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed && (
              <Box mx="md">
                <TokenWarningCard
                  tokenWarningLevel={tokenWarningLevel}
                  onDismiss={warningDismissCallback}
                />
              </Box>
            )}
          </Flex>
        </VirtualizedList>
        {/* Fixed footer that appears on scroll */}
        {FixedFooterBar}
      </Screen>

      <AnimatedFlex row gap="sm" mb="lg" px="sm" py="xs" style={bottomButtonStyle}>
        <Button
          emphasis={ButtonEmphasis.High}
          flex={1}
          label={t('Swap')}
          size={ButtonSize.Medium}
          state={
            tokenWarningLevel === TokenWarningLevel.BLOCKED
              ? ButtonState.Disabled
              : ButtonState.Enabled
          }
          onPress={() => onPressSwap(balance ? SwapType.SELL : SwapType.BUY)}
        />
      </AnimatedFlex>

      {activeSwapAttemptType === SwapType.BUY || activeSwapAttemptType === SwapType.SELL ? (
        <TokenWarningModal
          isVisible
          currency={currency}
          tokenWarningLevel={tokenWarningLevel}
          onAccept={activeSwapAttemptType === SwapType.BUY ? navigateToSwapBuy : navigateToSwapSell}
          onClose={() => setActiveSwapAttemptType(undefined)}
        />
      ) : null}
    </>
  )
}
