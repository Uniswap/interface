import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { BuyNativeTokenModal } from 'src/components/TokenDetails/BuyNativeTokenModal'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsActionButtons } from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import { useCrossChainBalances } from 'src/components/TokenDetails/hooks'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loader } from 'src/components/loading/loaders'
import { selectModalState } from 'src/features/modals/selectModalState'
import { disableOnPress } from 'src/utils/disableOnPress'
import { useSkeletonLoading } from 'src/utils/useSkeletonLoading'
import { Flex, Separator, Text, TouchableArea, useDeviceInsets, useIsDarkMode, useSporeColors } from 'ui/src'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { useExtractedTokenColor } from 'ui/src/utils/colors'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  SafetyLevel,
  TokenDetailsScreenQuery,
  useTokenDetailsScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AssetType } from 'uniswap/src/entities/assets'
import { useSwappableTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/useSwappableTokenWithHighestBalance'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Language } from 'uniswap/src/features/language/constants'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import {
  buildCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { isError, isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { useTokenContextMenu } from 'wallet/src/features/portfolio/useTokenContextMenu'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function HeaderTitleElement({
  data,
  ellipsisMenuVisible,
}: {
  data: TokenDetailsScreenQuery | undefined
  ellipsisMenuVisible?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const onChainData = data?.token
  const offChainData = onChainData?.project

  const price = offChainData?.markets?.[0]?.price?.value ?? onChainData?.market?.price?.value
  const logo = offChainData?.logoUrl ?? undefined
  const symbol = onChainData?.symbol
  const name = onChainData?.name
  const chain = onChainData?.chain

  return (
    <Flex alignItems="center" justifyContent="space-between" ml={ellipsisMenuVisible ? '$spacing32' : '$none'}>
      <Text color="$neutral1" variant="body1">
        {convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)}
      </Text>
      <Flex centered row gap="$spacing4">
        <TokenLogo
          chainId={fromGraphQLChain(chain) ?? undefined}
          name={name}
          size={iconSizes.icon16}
          symbol={symbol ?? undefined}
          url={logo}
        />
        <Text color="$neutral2" numberOfLines={1} variant="buttonLabel3">
          {symbol ?? t('token.error.unknown')}
        </Text>
      </Flex>
    </Flex>
  )
}

export function TokenDetailsScreen({ route }: AppStackScreenProp<MobileScreens.TokenDetails>): JSX.Element {
  const { currencyId: _currencyId } = route.params
  // Potentially delays loading of perf-heavy content to speed up navigation
  const showSkeleton = useSkeletonLoading()
  const language = useCurrentLanguage()

  // Token details screen query
  const { data, refetch, networkStatus } = useTokenDetailsScreenQuery({
    variables: {
      ...currencyIdToContractInput(_currencyId),
      includeSpanish:
        language === Language.SpanishSpain ||
        language === Language.SpanishLatam ||
        language === Language.SpanishUnitedStates,
      includeFrench: language === Language.French,
      includeJapanese: language === Language.Japanese,
      includePortuguese: language === Language.Portuguese,
      includeChineseSimplified: language === Language.ChineseSimplified,
      includeChineseTraditional: language === Language.ChineseTraditional,
    },
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  })

  const retry = useCallback(async () => {
    await refetch(currencyIdToContractInput(_currencyId))
  }, [_currencyId, refetch])

  const isLoading = !data && isNonPollingRequestInFlight(networkStatus)

  // Preload token price graphs
  const { error: tokenPriceHistoryError } = useTokenPriceHistory(_currencyId)

  const traceProperties = useMemo(
    () => ({
      address: currencyIdToAddress(_currencyId),
      chain: currencyIdToChain(_currencyId),
      currencyName: data?.token?.name,
    }),
    [_currencyId, data?.token?.name],
  )

  return (
    <ReactNavigationPerformanceView interactive screenName={MobileScreens.TokenDetails}>
      <Trace directFromPage logImpression properties={traceProperties} screen={MobileScreens.TokenDetails}>
        <TokenDetails
          _currencyId={_currencyId}
          data={data}
          error={isError(networkStatus, !!data) || !!tokenPriceHistoryError}
          loading={isLoading}
          retry={retry}
          showSkeleton={showSkeleton}
        />
      </Trace>
    </ReactNavigationPerformanceView>
  )
}

function TokenDetails({
  _currencyId,
  data,
  error,
  retry,
  loading,
  showSkeleton,
}: {
  _currencyId: string
  data: TokenDetailsScreenQuery | undefined
  error: boolean
  retry: () => void
  loading: boolean
  showSkeleton: boolean
}): JSX.Element {
  const colors = useSporeColors()
  const insets = useDeviceInsets()
  const isDarkMode = useIsDarkMode()

  const currencyChainId = (currencyIdToChain(_currencyId) as WalletChainId) ?? UniverseChainId.Mainnet
  const currencyAddress = currencyIdToAddress(_currencyId)

  const token = data?.token
  const tokenLogoUrl = token?.project?.logoUrl
  const tokenSymbol = token?.name

  const currencyInfo = useCurrencyInfo(_currencyId)

  const crossChainTokens = token?.project?.tokens
  const { currentChainBalance, otherChainBalances } = useCrossChainBalances(_currencyId, crossChainTokens)
  const hasTokenBalance = Boolean(currentChainBalance)
  const isNativeCurrency = isNativeCurrencyAddress(currencyChainId, currencyAddress)

  const activeAddress = useActiveAccountAddressWithThrow()
  const { balance: nativeCurrencyBalance } = useOnChainNativeCurrencyBalance(currencyChainId, activeAddress)
  const hasZeroNativeBalance = nativeCurrencyBalance && nativeCurrencyBalance.equalTo('0')
  const nativeCurrencyAddress = UNIVERSE_CHAIN_INFO[currencyChainId].nativeCurrency.address
  const nativeFiatOnRampCurrency = useIsSupportedFiatOnRampCurrency(
    buildCurrencyId(currencyChainId, nativeCurrencyAddress),
    isNativeCurrency || !hasZeroNativeBalance,
  )

  const fiatOnRampCurrency = useIsSupportedFiatOnRampCurrency(_currencyId, !isNativeCurrency)
  const shouldNavigateToFiatOnRampOnBuy = !hasTokenBalance && Boolean(fiatOnRampCurrency) && isNativeCurrency
  const shouldOpenBuyNativeTokenModalOnBuy =
    Boolean(nativeFiatOnRampCurrency) && !isNativeCurrency && hasZeroNativeBalance

  const { tokenColor, tokenColorLoading } = useExtractedTokenColor(
    tokenLogoUrl,
    tokenSymbol,
    /*background=*/ colors.surface1.val,
    /*default=*/ colors.neutral3.val,
  )

  const onPriceChartRetry = useCallback((): void => {
    if (!error) {
      return
    }
    retry()
  }, [error, retry])

  const { navigateToFiatOnRamp, navigateToSwapFlow, navigateToSend } = useWalletNavigation()

  // set if attempting buy or sell, use for warning modal
  const [activeTransactionType, setActiveTransactionType] = useState<CurrencyField | undefined>(undefined)

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showBuyNativeTokenModal, setShowBuyNativeTokenModal] = useState(false)
  const { tokenWarningDismissed, onDismissTokenWarning } = useDismissedTokenWarnings(
    isNativeCurrency ? undefined : { chainId: currencyChainId, address: currencyAddress },
  )

  const safetyLevel = token?.project?.safetyLevel

  const swappableTokenWithHighestBalance = useSwappableTokenWithHighestBalance({
    currencyAddress,
    currencyChainId,
    otherChainBalances,
  })

  const onPressSend = useCallback(() => {
    // Do not show warning modal speedbump if user is trying to send tokens they own
    navigateToSend({ currencyAddress, chainId: currencyChainId })
  }, [currencyAddress, currencyChainId, navigateToSend])

  const onPressSwap = useCallback(
    (currencyField: CurrencyField) => {
      if (safetyLevel === SafetyLevel.Blocked) {
        setShowWarningModal(true)
        // show warning modal speed bump if token has a warning level and user has not dismissed
      } else if (safetyLevel !== SafetyLevel.Verified && !tokenWarningDismissed) {
        setActiveTransactionType(currencyField)
        setShowWarningModal(true)
      } else if (swappableTokenWithHighestBalance && currencyField === CurrencyField.OUTPUT) {
        // When clicking "Buy", if the user has a balance in another chain, we prepopulate the input token with that token.
        setActiveTransactionType(undefined)
        navigateToSwapFlow({
          initialState: {
            exactCurrencyField: CurrencyField.INPUT,
            input: {
              address: currencyIdToAddress(swappableTokenWithHighestBalance.currencyInfo.currencyId),
              chainId: swappableTokenWithHighestBalance.currencyInfo.currency.chainId,
              type: AssetType.Currency,
            },
            output: {
              address: currencyAddress,
              chainId: currencyChainId,
              type: AssetType.Currency,
            },
            exactAmountToken: '',
          },
        })
      } else {
        setActiveTransactionType(undefined)
        navigateToSwapFlow({ currencyField, currencyAddress, currencyChainId })
      }
    },
    [
      currencyAddress,
      currencyChainId,
      navigateToSwapFlow,
      safetyLevel,
      swappableTokenWithHighestBalance,
      tokenWarningDismissed,
    ],
  )

  const onPressBuyFiatOnRamp = useCallback((): void => {
    navigateToFiatOnRamp({ prefilledCurrency: fiatOnRampCurrency })
  }, [navigateToFiatOnRamp, fiatOnRampCurrency])

  const onPressBuyZeroBalance = useCallback(() => {
    setShowBuyNativeTokenModal(true)
  }, [])

  const onPressBuy = useCallback(() => {
    if (shouldOpenBuyNativeTokenModalOnBuy) {
      onPressBuyZeroBalance()
    } else if (shouldNavigateToFiatOnRampOnBuy) {
      onPressBuyFiatOnRamp()
    } else {
      onPressSwap(CurrencyField.OUTPUT)
    }
  }, [
    onPressBuyFiatOnRamp,
    onPressBuyZeroBalance,
    shouldOpenBuyNativeTokenModalOnBuy,
    shouldNavigateToFiatOnRampOnBuy,
    onPressSwap,
  ])

  const onAcceptWarning = useCallback(() => {
    onDismissTokenWarning()
    setShowWarningModal(false)
    if (activeTransactionType !== undefined) {
      navigateToSwapFlow({ currencyField: activeTransactionType, currencyAddress, currencyChainId })
    }
  }, [activeTransactionType, currencyAddress, currencyChainId, onDismissTokenWarning, navigateToSwapFlow])

  const inModal = useSelector(selectModalState(ModalName.Explore)).isOpen

  const loadingColor = isDarkMode ? colors.neutral3.val : colors.surface3.val

  const [ellipsisMenuVisible, setEllipsisMenuVisible] = useState<boolean>(false)

  return (
    <Trace screen={MobileScreens.TokenDetails}>
      <HeaderScrollScreen
        centerElement={<HeaderTitleElement data={data} ellipsisMenuVisible={ellipsisMenuVisible} />}
        renderedInModal={inModal}
        rightElement={
          showSkeleton ? undefined : (
            <HeaderRightElement
              currencyId={_currencyId}
              currentChainBalance={currentChainBalance}
              data={data}
              isBlocked={safetyLevel === SafetyLevel.Blocked}
              setEllipsisMenuVisible={setEllipsisMenuVisible}
            />
          )
        }
        showHandleBar={inModal}
      >
        <Flex gap="$spacing16" pb="$spacing16">
          <Flex gap="$spacing4">
            <TokenDetailsHeader
              data={data}
              loading={loading}
              onPressWarningIcon={(): void => setShowWarningModal(true)}
            />
            <PriceExplorer
              currencyId={_currencyId}
              forcePlaceholder={showSkeleton}
              tokenColor={tokenColorLoading ? loadingColor : tokenColor ?? colors.accent1.val}
              onRetry={onPriceChartRetry}
            />
          </Flex>
          {error ? (
            <AnimatedFlex entering={FadeInDown} exiting={FadeOutDown} px="$spacing24">
              <BaseCard.InlineErrorState onRetry={retry} />
            </AnimatedFlex>
          ) : null}
          <Flex gap="$spacing16" mb="$spacing8" px="$spacing16">
            <TokenBalances
              currentChainBalance={currentChainBalance}
              otherChainBalances={otherChainBalances}
              onPressSend={onPressSend}
            />
            <Separator />
            {showSkeleton ? (
              <TokenDetailsTextPlaceholders />
            ) : (
              <>
                <Flex gap="$spacing24">
                  <TokenDetailsStats data={data} tokenColor={tokenColor} />
                  <TokenDetailsLinks currencyId={_currencyId} data={data} />
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      {!loading && !tokenColorLoading ? (
        <AnimatedFlex backgroundColor="$surface1" entering={FadeInDown} style={{ marginBottom: insets.bottom }}>
          <TokenDetailsActionButtons
            tokenColor={tokenColor}
            userHasBalance={hasTokenBalance}
            onPressBuy={onPressBuy}
            onPressSell={(): void => onPressSwap(CurrencyField.INPUT)}
          />
        </AnimatedFlex>
      ) : null}

      {currencyInfo && (
        <TokenWarningModal
          currencyInfo0={currencyInfo}
          isInfoOnlyWarning={activeTransactionType === undefined}
          isVisible={showWarningModal}
          closeModalOnly={(): void => {
            setActiveTransactionType(undefined)
            setShowWarningModal(false)
          }}
          onAcknowledge={onAcceptWarning}
        />
      )}

      {showBuyNativeTokenModal && (
        <BuyNativeTokenModal
          chainId={currencyChainId}
          currencyId={_currencyId}
          onClose={(): void => {
            setShowBuyNativeTokenModal(false)
          }}
        />
      )}
    </Trace>
  )
}

function TokenDetailsTextPlaceholders(): JSX.Element {
  return (
    <>
      <Flex>
        <Loader.Box height={fonts.subheading2.lineHeight} pb="$spacing4" width="100%" />
        <Loader.Box height={fonts.body2.lineHeight} width="100%" />
      </Flex>

      <Flex>
        <Loader.Box height={fonts.subheading2.lineHeight} pb="$spacing4" />
        <Flex gap="$spacing8">
          <Loader.Box height={fonts.body2.lineHeight} repeat={4} width="100%" />
        </Flex>
      </Flex>
    </>
  )
}

function HeaderRightElement({
  currencyId,
  currentChainBalance,
  isBlocked,
  data,
  setEllipsisMenuVisible,
}: {
  currencyId: string
  currentChainBalance: PortfolioBalance | null
  isBlocked: boolean
  data?: TokenDetailsScreenQuery
  setEllipsisMenuVisible: (visible: boolean) => void
}): JSX.Element {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId,
    isBlocked,
    tokenSymbolForNotification: data?.token?.symbol,
    portfolioBalance: currentChainBalance,
  })

  // Should be the same color as heart icon in not favorited state next to it
  const ellipsisColor = isDarkMode ? colors.neutral2.get() : colors.neutral2.get()

  const ellipsisMenuVisible = menuActions.length > 0

  useEffect(() => {
    setEllipsisMenuVisible(ellipsisMenuVisible)
  }, [ellipsisMenuVisible, setEllipsisMenuVisible])

  return (
    <AnimatedFlex row alignItems="center" entering={FadeIn} gap="$spacing16">
      {ellipsisMenuVisible && (
        <ContextMenu dropdownMenuMode actions={menuActions} onPress={onContextMenuPress}>
          <TouchableArea
            hapticFeedback
            hitSlop={{ right: 5, left: 20, top: 20, bottom: 20 }}
            style={{ padding: spacing.spacing8, marginRight: -spacing.spacing8 }}
            testID={TestID.TokenDetailsMoreButton}
            onLongPress={disableOnPress}
            onPress={disableOnPress}
          >
            <EllipsisIcon color={ellipsisColor} height={iconSizes.icon16} width={iconSizes.icon16} />
          </TouchableArea>
        </ContextMenu>
      )}
      <TokenDetailsFavoriteButton currencyId={currencyId} />
    </AnimatedFlex>
  )
}
