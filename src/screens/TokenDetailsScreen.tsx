import { useResponsiveProp } from '@shopify/restyle'
import React, { ReactElement, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { AnimatedBox, AnimatedFlex, Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { CurrencyPriceChart } from 'src/components/PriceChart'
import { useTokenPriceGraphs } from 'src/components/PriceChart/TokenModel'
import { Text } from 'src/components/Text'
import { useCrossChainBalances } from 'src/components/TokenDetails/hooks'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsActionButtons } from 'src/components/TokenDetails/TokenDetailsActionButton'
import { TokenDetailsFavoriteButton } from 'src/components/TokenDetails/TokenDetailsFavoriteButton'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import { ChainId } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import { isError, isNonPollingRequestInFlight } from 'src/data/utils'
import {
  SafetyLevel,
  TokenDetailsScreenQuery,
  useTokenDetailsScreenQuery,
} from 'src/data/__generated__/types-and-hooks'
import { AssetType } from 'src/entities/assets'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useTokenWarningDismissed } from 'src/features/tokens/safetyHooks'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { iconSizes } from 'src/styles/sizing'
import { fromGraphQLChain } from 'src/utils/chainId'
import { useExtractedTokenColor } from 'src/utils/colors'
import { currencyIdToAddress, currencyIdToChain } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

type Price = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<NonNullable<TokenDetailsScreenQuery['tokens']>[0]>['project']
    >['markets']
  >[0]
>['price']

function HeaderPriceLabel({ price }: { price: Price }): ReactElement {
  const { t } = useTranslation()

  return (
    <Text color="textPrimary" variant="bodyLarge">
      {formatUSDPrice(price?.value) ?? t('Unknown token')}
    </Text>
  )
}

function HeaderTitleElement({ data }: { data: TokenDetailsScreenQuery | undefined }): ReactElement {
  const { t } = useTranslation()

  const token = data?.tokens?.[0]
  const tokenProject = token?.project

  return (
    <Flex alignItems="center" gap="none" justifyContent="space-between">
      <HeaderPriceLabel price={tokenProject?.markets?.[0]?.price} />
      <Flex centered row gap="xxs">
        <TokenLogo
          chainId={fromGraphQLChain(token?.chain) ?? undefined}
          size={iconSizes.sm}
          symbol={token?.symbol ?? undefined}
          url={tokenProject?.logoUrl ?? undefined}
        />
        <Text color="textSecondary" variant="buttonLabelMicro">
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
}: AppStackScreenProp<Screens.TokenDetails>): ReactElement {
  const { currencyId: _currencyId } = route.params

  const { data, refetch, networkStatus } = useTokenDetailsScreenQuery({
    variables: {
      contract: currencyIdToContractInput(_currencyId),
    },
    pollInterval: PollingInterval.Fast,
    notifyOnNetworkStatusChange: true,
  })

  const retry = useCallback(() => {
    refetch({ contract: currencyIdToContractInput(_currencyId) })
  }, [_currencyId, refetch])

  const isLoading = !data && isNonPollingRequestInFlight(networkStatus)

  return (
    <TokenDetails
      _currencyId={_currencyId}
      data={data}
      error={isError(networkStatus, !!data)}
      loading={isLoading}
      retry={retry}
    />
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

  const currencyChainId = currencyIdToChain(_currencyId) ?? ChainId.Mainnet
  const currencyAddress = currencyIdToAddress(_currencyId)

  const crossChainTokens = data?.tokens?.[0]?.project?.tokens
  const { currentChainBalance, otherChainBalances } = useCrossChainBalances(
    _currencyId,
    crossChainTokens
  )

  const tokenPriceGraphResponse = useTokenPriceGraphs(_currencyId)
  const priceGraphError = tokenPriceGraphResponse.error !== undefined

  const token = data?.tokens?.[0]
  const tokenLogoUrl = token?.project?.logoUrl

  const { tokenColor, tokenColorLoading } = useExtractedTokenColor(
    tokenLogoUrl,
    theme.colors.background0,
    theme.colors.textTertiary
  )

  const onPriceChartRetry = (): void => {
    if (error) {
      retry()
    }
  }

  // set if attempting buy or sell, use for warning modal
  const [activeTransactionType, setActiveTransactionType] = useState<TransactionType | undefined>(
    undefined
  )

  const [showWarningModal, setShowWarningModal] = useState(false)
  const { tokenWarningDismissed, dismissWarningCallback } = useTokenWarningDismissed(_currencyId)

  const safetyLevel = data?.tokens?.[0]?.project?.safetyLevel

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
      // show warning modal speedbump if token has a warning level and user has not dismissed
      if (safetyLevel !== SafetyLevel.Verified && !tokenWarningDismissed) {
        setActiveTransactionType(swapType)
        setShowWarningModal(true)
      } else {
        if (swapType === TransactionType.BUY) {
          navigateToSwapBuy()
        }
        if (swapType === TransactionType.SELL) {
          navigateToSwapSell()
        }
        return
      }
    },
    [navigateToSwapBuy, navigateToSwapSell, safetyLevel, tokenWarningDismissed]
  )

  const onPressSend = useCallback(() => {
    // show warning modal speedbump if token has a warning level and user has not dismissed
    if (safetyLevel !== SafetyLevel.Verified && !tokenWarningDismissed) {
      setActiveTransactionType(TransactionType.SEND)
      setShowWarningModal(true)
    } else {
      dispatch(openModal({ name: ModalName.Send, ...{ initialState: initialSendState } }))
    }
  }, [safetyLevel, tokenWarningDismissed, dispatch, initialSendState])

  const onAcceptWarning = useCallback(() => {
    dismissWarningCallback()
    setShowWarningModal(false)
    if (activeTransactionType === TransactionType.BUY) {
      navigateToSwapBuy()
    } else if (activeTransactionType === TransactionType.SELL) {
      navigateToSwapSell()
    } else if (activeTransactionType === TransactionType.SEND) {
      navigateToSwapSell()
      dispatch(openModal({ name: ModalName.Send, ...{ initialState: initialSendState } }))
    }
  }, [
    activeTransactionType,
    dismissWarningCallback,
    dispatch,
    initialSendState,
    navigateToSwapBuy,
    navigateToSwapSell,
  ])

  const pb = useResponsiveProp({ xs: 'none', sm: 'md' })

  return (
    <AnimatedBox flexGrow={1} pb={pb}>
      <HeaderScrollScreen
        centerElement={<HeaderTitleElement data={data} />}
        rightElement={<TokenDetailsFavoriteButton currencyId={_currencyId} />}>
        <Flex gap="xl" my="xs">
          <Flex gap="xxs">
            <TokenDetailsHeader
              data={data}
              loading={loading}
              onPressWarningIcon={(): void => setShowWarningModal(true)}
            />
            <CurrencyPriceChart
              currencyId={_currencyId}
              tokenColor={tokenColor}
              tokenColorLoading={tokenColorLoading}
              tokenPriceGraphResult={tokenPriceGraphResponse}
              onRetry={onPriceChartRetry}
            />
          </Flex>
          {error && !priceGraphError ? (
            <AnimatedBox entering={FadeInDown} exiting={FadeOutDown} paddingHorizontal="lg">
              <BaseCard.InlineErrorState onRetry={retry} />
            </AnimatedBox>
          ) : null}
          <Flex gap="lg">
            <TokenBalances
              currentChainBalance={currentChainBalance}
              otherChainBalances={otherChainBalances}
            />
            <Box mb="xs" mx="md">
              <TokenDetailsStats currencyId={_currencyId} data={data} tokenColor={tokenColor} />
            </Box>
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      {!loading && !tokenColorLoading ? (
        <AnimatedFlex entering={FadeInDown}>
          <TokenDetailsActionButtons
            showSend={!!currentChainBalance}
            tokenColor={tokenColor}
            onPressSend={onPressSend}
            onPressSwap={
              safetyLevel === SafetyLevel.Blocked
                ? undefined
                : (): void =>
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
        onAccept={onAcceptWarning}
        onClose={(): void => {
          setActiveTransactionType(undefined)
          setShowWarningModal(false)
        }}
      />
    </AnimatedBox>
  )
}
