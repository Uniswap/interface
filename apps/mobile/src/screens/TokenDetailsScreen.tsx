import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { useResponsiveProp } from '@shopify/restyle'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedBox, AnimatedFlex, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Separator } from 'src/components/layout/Separator'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { Text } from 'src/components/Text'
import { useCrossChainBalances } from 'src/components/TokenDetails/hooks'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsActionButtons } from 'src/components/TokenDetails/TokenDetailsActionButton'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID, IS_IOS } from 'src/constants/globals'
import { useTokenContextMenu } from 'src/features/balances/hooks'
import { openModal, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useTokenWarningDismissed } from 'src/features/tokens/safetyHooks'
import { Screens } from 'src/screens/Screens'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import { iconSizes } from 'ui/src/theme'
import { formatUSDPrice } from 'utilities/src/format/format'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { ChainId } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isError, isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import {
  SafetyLevel,
  TokenDetailsScreenQuery,
  useTokenDetailsScreenQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { AssetType } from 'wallet/src/entities/assets'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { currencyIdToContractInput } from 'wallet/src/features/dataApi/utils'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { useExtractedTokenColor } from 'wallet/src/utils/colors'
import { currencyIdToAddress, currencyIdToChain } from 'wallet/src/utils/currencyId'

type Price = NonNullable<
  NonNullable<NonNullable<NonNullable<TokenDetailsScreenQuery['token']>['project']>['markets']>[0]
>['price']

function HeaderPriceLabel({ price }: { price: Price }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Text color="neutral1" variant="bodyLarge">
      {formatUSDPrice(price?.value) ?? t('Unknown token')}
    </Text>
  )
}

function HeaderTitleElement({
  data,
  ellipsisMenuVisible,
}: {
  data: TokenDetailsScreenQuery | undefined
  ellipsisMenuVisible?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const token = data?.token
  const tokenProject = token?.project

  return (
    <Flex
      alignItems="center"
      gap="none"
      justifyContent="space-between"
      ml={ellipsisMenuVisible ? 'spacing32' : 'none'}>
      <HeaderPriceLabel price={tokenProject?.markets?.[0]?.price} />
      <Flex centered row gap="spacing4">
        <TokenLogo
          chainId={fromGraphQLChain(token?.chain) ?? undefined}
          size={iconSizes.icon16}
          symbol={token?.symbol ?? undefined}
          url={tokenProject?.logoUrl ?? undefined}
        />
        <Text color="neutral2" numberOfLines={1} variant="buttonLabelMicro">
          {token?.symbol ?? t('Unknown token')}
        </Text>
      </Flex>
    </Flex>
  )
}

enum TransactionType {
  BUY,
  SELL,
  SEND,
}

export function TokenDetailsScreen({
  route,
}: AppStackScreenProp<Screens.TokenDetails>): JSX.Element {
  const { currencyId: _currencyId } = route.params

  // Token details screen query
  const { data, refetch, networkStatus } = useTokenDetailsScreenQuery({
    variables: currencyIdToContractInput(_currencyId),
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
      currencyName: data?.token?.project?.name,
    }),
    [_currencyId, data?.token?.project?.name]
  )

  return (
    <ReactNavigationPerformanceView interactive={isLoading} screenName={Screens.TokenDetails}>
      <Trace
        directFromPage
        logImpression
        properties={traceProperties}
        screen={Screens.TokenDetails}>
        <TokenDetails
          _currencyId={_currencyId}
          data={data}
          error={isError(networkStatus, !!data) || !!tokenPriceHistoryError}
          loading={isLoading}
          retry={retry}
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
}: {
  _currencyId: string
  data: TokenDetailsScreenQuery | undefined
  error: boolean
  retry: () => void
  loading: boolean
}): JSX.Element {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()

  const currencyChainId = currencyIdToChain(_currencyId) ?? ChainId.Mainnet
  const currencyAddress = currencyIdToAddress(_currencyId)

  const token = data?.token
  const tokenLogoUrl = token?.project?.logoUrl

  const crossChainTokens = token?.project?.tokens
  const { currentChainBalance, otherChainBalances } = useCrossChainBalances(
    _currencyId,
    crossChainTokens
  )

  const { tokenColor, tokenColorLoading } = useExtractedTokenColor(
    tokenLogoUrl,
    /*background=*/ theme.colors.surface1,
    /*default=*/ theme.colors.neutral3
  )

  const onPriceChartRetry = useCallback((): void => {
    if (!error) {
      return
    }
    retry()
  }, [error, retry])

  // set if attempting buy or sell, use for warning modal
  const [activeTransactionType, setActiveTransactionType] = useState<TransactionType | undefined>(
    undefined
  )

  const [showWarningModal, setShowWarningModal] = useState(false)
  const { tokenWarningDismissed, dismissWarningCallback } = useTokenWarningDismissed(_currencyId)

  const safetyLevel = token?.project?.safetyLevel

  const initialSendState = useMemo((): TransactionState => {
    return {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      [CurrencyField.INPUT]: {
        address: currencyAddress,
        chainId: currencyChainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
      showRecipientSelector: true,
    }
  }, [currencyAddress, currencyChainId])

  const navigateToSwapBuy = useCallback(() => {
    setActiveTransactionType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmountToken: '',
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: currencyAddress,
        chainId: currencyChainId,
        type: AssetType.Currency,
      },
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currencyAddress, currencyChainId, dispatch])

  const navigateToSwapSell = useCallback(() => {
    setActiveTransactionType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      [CurrencyField.INPUT]: {
        address: currencyAddress,
        chainId: currencyChainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currencyAddress, currencyChainId, dispatch])

  const onPressSwap = useCallback(
    (swapType: TransactionType.BUY | TransactionType.SELL) => {
      if (safetyLevel === SafetyLevel.Blocked) {
        setShowWarningModal(true)
        // show warning modal speed bump if token has a warning level and user has not dismissed
      } else if (safetyLevel !== SafetyLevel.Verified && !tokenWarningDismissed) {
        setActiveTransactionType(swapType)
        setShowWarningModal(true)
      } else {
        if (swapType === TransactionType.BUY) {
          navigateToSwapBuy()
        } else if (swapType === TransactionType.SELL) {
          navigateToSwapSell()
        }
      }
    },
    [navigateToSwapBuy, navigateToSwapSell, safetyLevel, tokenWarningDismissed]
  )

  const onPressSend = useCallback(() => {
    // Do not show warning modal speedbump if user is trying to send tokens they own
    dispatch(openModal({ name: ModalName.Send, ...{ initialState: initialSendState } }))
  }, [dispatch, initialSendState])

  const onAcceptWarning = useCallback(() => {
    dismissWarningCallback()
    setShowWarningModal(false)
    if (activeTransactionType === TransactionType.BUY) {
      navigateToSwapBuy()
    } else if (activeTransactionType === TransactionType.SELL) {
      navigateToSwapSell()
    }
  }, [activeTransactionType, dismissWarningCallback, navigateToSwapBuy, navigateToSwapSell])

  const pb = useResponsiveProp(IS_IOS ? { xs: 'none', sm: 'spacing16' } : 'none')

  const inModal = useAppSelector(selectModalState(ModalName.Explore)).isOpen

  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId: _currencyId,
    isSpam: currentChainBalance?.currencyInfo.isSpam,
    isNative: currentChainBalance?.currencyInfo.currency.isNative,
    balanceUSD: currentChainBalance?.balanceUSD,
    tokenSymbolForNotification: data?.token?.symbol,
  })

  const isDarkMode = useIsDarkMode()
  // shall be the same color as heart icon in not favorited state next to it
  const ellipsisColor = isDarkMode ? theme.colors.neutral2 : theme.colors.neutral2
  const loadingColor = isDarkMode ? theme.colors.neutral3 : theme.colors.surface3

  const ellipsisMenuVisible = menuActions.length > 0

  return (
    <Trace screen={Screens.TokenDetails}>
      <HeaderScrollScreen
        centerElement={<HeaderTitleElement data={data} ellipsisMenuVisible={ellipsisMenuVisible} />}
        renderedInModal={inModal}
        rightElement={
          <Flex row alignItems="center">
            {ellipsisMenuVisible && (
              <ContextMenu dropdownMenuMode actions={menuActions} onPress={onContextMenuPress}>
                <TouchableArea
                  hapticFeedback
                  style={{ padding: theme.spacing.spacing8, marginRight: -theme.spacing.spacing8 }}>
                  <EllipsisIcon
                    color={ellipsisColor}
                    height={iconSizes.icon16}
                    width={iconSizes.icon16}
                  />
                </TouchableArea>
              </ContextMenu>
            )}
            <TokenDetailsFavoriteButton currencyId={_currencyId} />
          </Flex>
        }
        showHandleBar={inModal}>
        <Flex gap="spacing36" my="spacing8" pb="spacing16">
          <Flex gap="spacing4">
            <TokenDetailsHeader
              data={data}
              loading={loading}
              onPressWarningIcon={(): void => setShowWarningModal(true)}
            />
            <PriceExplorer
              currencyId={_currencyId}
              tokenColor={tokenColorLoading ? loadingColor : tokenColor ?? theme.colors.accent1}
              onRetry={onPriceChartRetry}
            />
          </Flex>
          {error ? (
            <AnimatedBox entering={FadeInDown} exiting={FadeOutDown} gap="$none" px="$spacing24">
              <BaseCard.InlineErrorState onRetry={retry} />
            </AnimatedBox>
          ) : null}
          <Flex gap="spacing24" mb="spacing8" px="spacing16">
            <TokenBalances
              currentChainBalance={currentChainBalance}
              otherChainBalances={otherChainBalances}
              onPressSend={onPressSend}
            />
            <Separator />
            <TokenDetailsStats data={data} tokenColor={tokenColor} />
            <TokenDetailsLinks currencyId={_currencyId} data={data} />
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      {!loading && !tokenColorLoading ? (
        <AnimatedFlex
          backgroundColor="surface1"
          entering={FadeInDown}
          pb={pb}
          style={{ marginBottom: IS_ANDROID ? insets.bottom : undefined }}>
          <TokenDetailsActionButtons
            tokenColor={tokenColor}
            onPressSwap={(): void =>
              onPressSwap(currentChainBalance ? TransactionType.SELL : TransactionType.BUY)
            }
          />
        </AnimatedFlex>
      ) : null}

      <TokenWarningModal
        currencyId={_currencyId}
        disableAccept={activeTransactionType === undefined}
        isVisible={showWarningModal}
        safetyLevel={safetyLevel}
        tokenLogoUrl={token?.project?.logoUrl}
        onAccept={onAcceptWarning}
        onClose={(): void => {
          setActiveTransactionType(undefined)
          setShowWarningModal(false)
        }}
      />
    </Trace>
  )
}
