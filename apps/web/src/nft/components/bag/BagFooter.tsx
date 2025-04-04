import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { InterfaceElementName, NFTEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getURAddress, useNftUniversalRouterAddress } from 'graphql/data/nft/NftUniversalRouterAddress'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import { useSwitchChain } from 'hooks/useSwitchChain'
import JSBI from 'jsbi'
import useCurrencyBalance, { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { BuyButtonStateData, BuyButtonStates, getBuyButtonStateData } from 'nft/components/bag/ButtonStates'
import { useBag } from 'nft/hooks/useBag'
import { useBagTotalEthPrice } from 'nft/hooks/useBagTotalEthPrice'
import useDerivedPayWithAnyTokenSwapInfo from 'nft/hooks/useDerivedPayWithAnyTokenSwapInfo'
import { useFetchAssets } from 'nft/hooks/useFetchAssets'
import usePayWithAnyTokenSwap from 'nft/hooks/usePayWithAnyTokenSwap'
import { PriceImpact, usePriceImpact } from 'nft/hooks/usePriceImpact'
import { useSubscribeTransactionState } from 'nft/hooks/useSubscribeTransactionState'
import { useTokenInput } from 'nft/hooks/useTokenInput'
import { BagStatus } from 'nft/types'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { InterfaceTrade, TradeFillType, TradeState } from 'state/routing/types'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const InputCurrencyValue = ({
  usingPayWithAnyToken,
  totalEthPrice,
  activeCurrency,
  tradeState,
  trade,
}: {
  usingPayWithAnyToken: boolean
  totalEthPrice: BigNumber
  activeCurrency?: Currency | null
  tradeState: TradeState
  trade?: InterfaceTrade
}) => {
  const { formatEther, formatNumberOrString } = useFormatter()

  if (!usingPayWithAnyToken) {
    return (
      <Text variant="buttonLabel2">
        {formatEther({ input: totalEthPrice.toString(), type: NumberType.NFTToken })}
        &nbsp;{activeCurrency?.symbol ?? 'ETH'}
      </Text>
    )
  }

  if (tradeState === TradeState.LOADING && !trade) {
    return (
      <Text variant="body2" color="$neutral3">
        <Trans i18nKey="swap.fetchingPrice" />
      </Text>
    )
  }

  return (
    <Text variant="body2" color={tradeState === TradeState.LOADING ? '$neutral3' : '$neutral1'} numberOfLines={1}>
      {formatNumberOrString({ input: trade?.inputAmount.toExact(), type: NumberType.NFTToken })}
    </Text>
  )
}

const FiatValue = ({
  usdcValue,
  priceImpact,
  tradeState,
  usingPayWithAnyToken,
}: {
  usdcValue: CurrencyAmount<Currency> | null
  priceImpact?: PriceImpact
  tradeState: TradeState
  usingPayWithAnyToken: boolean
}) => {
  const { t } = useTranslation()
  const { formatNumberOrString } = useFormatter()

  if (!usdcValue) {
    if (usingPayWithAnyToken && (tradeState === TradeState.INVALID || tradeState === TradeState.NO_ROUTE_FOUND)) {
      return null
    }
    return <LoadingBubble width={4} height={20} borderRadius={4} alignSelf="flex-end" />
  }

  return (
    <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-end">
      {priceImpact && (
        <MouseoverTooltip text={t('swap.estimatedDifference.label')}>
          <Flex row alignItems="center" gap="$spacing8">
            <AlertTriangle color={priceImpact.priceImpactSeverity.color} size={16} />
            <Text variant="body3" color={priceImpact.priceImpactSeverity.color} lineHeight={20}>
              ({priceImpact.displayPercentage()})
            </Text>
          </Flex>
        </MouseoverTooltip>
      )}
      <Text variant="body3" color="$neutral3" lineHeight={20}>
        {formatNumberOrString({ input: usdcValue?.toExact(), type: NumberType.FiatNFTToken })}
      </Text>
    </Flex>
  )
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
]

interface BagFooterProps {
  setModalIsOpen: (open: boolean) => void
  eventProperties: Record<string, unknown>
}

export const BagFooter = ({ setModalIsOpen, eventProperties }: BagFooterProps) => {
  const accountDrawer = useAccountDrawer()
  const themeColors = useSporeColors()
  const account = useAccount()
  const isSupportedChain = useIsSupportedChainId(account.chainId)
  const connected = account.isConnected && account.chainId
  const totalEthPrice = useBagTotalEthPrice()
  const { inputCurrency } = useTokenInput(({ inputCurrency }) => ({ inputCurrency }))
  const setInputCurrency = useTokenInput((state) => state.setInputCurrency)
  const defaultCurrency = useCurrency('ETH')
  const inputCurrencyBalance = useTokenBalance(
    account.address,
    !!inputCurrency && inputCurrency.isToken ? inputCurrency : undefined,
  )
  const {
    isLocked: bagIsLocked,
    bagStatus,
    setBagExpanded,
    setBagStatus,
  } = useBag(({ isLocked, bagStatus, setBagExpanded, setBagStatus }) => ({
    isLocked,
    bagStatus,
    setBagExpanded,
    setBagStatus,
  }))
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)
  const isPending = PENDING_BAG_STATUSES.includes(bagStatus)
  const activeCurrency = inputCurrency ?? defaultCurrency
  const usingPayWithAnyToken = !!inputCurrency && account.chainId === UniverseChainId.Mainnet
  const { universalRouterAddress, universalRouterAddressIsLoading } = useNftUniversalRouterAddress()

  useSubscribeTransactionState(setModalIsOpen)
  const fetchAssets = useFetchAssets()

  const parsedOutputAmount = useMemo(() => {
    return tryParseCurrencyAmount(formatEther(totalEthPrice.toString()), defaultCurrency ?? undefined)
  }, [defaultCurrency, totalEthPrice])
  const {
    state: tradeState,
    trade,
    maximumAmountIn,
    allowedSlippage,
  } = useDerivedPayWithAnyTokenSwapInfo(usingPayWithAnyToken ? inputCurrency : undefined, parsedOutputAmount)
  const allowance = usePermit2Allowance(
    maximumAmountIn,
    getURAddress(isSupportedChain ? account.chainId : undefined, universalRouterAddress),
    TradeFillType.Classic,
  )
  const loadingAllowance = allowance.state === AllowanceState.LOADING || universalRouterAddressIsLoading
  usePayWithAnyTokenSwap(trade, allowance, allowedSlippage)
  const priceImpact = usePriceImpact(trade)

  const fiatValueTradeInput = useUSDCValue(trade?.inputAmount)
  const fiatValueTradeOutput = useUSDCValue(parsedOutputAmount)
  const usdcValue = usingPayWithAnyToken ? fiatValueTradeInput : fiatValueTradeOutput

  const nativeCurrency = useCurrency(NATIVE_CHAIN_ID)
  const nativeCurencyBalance = useCurrencyBalance(account.address ?? undefined, nativeCurrency)

  const sufficientBalance = useMemo(() => {
    if (!connected || account.chainId !== UniverseChainId.Mainnet) {
      return undefined
    }

    if (inputCurrency) {
      const inputAmount = trade?.inputAmount

      if (!inputCurrencyBalance || !inputAmount) {
        return undefined
      }

      return !inputCurrencyBalance.lessThan(inputAmount)
    }

    if (!nativeCurrency) {
      return undefined
    }

    const totalEthPriceCurrencyAmount = CurrencyAmount.fromRawAmount(nativeCurrency, JSBI.BigInt(totalEthPrice))
    return nativeCurencyBalance?.greaterThan(totalEthPriceCurrencyAmount)
  }, [
    connected,
    account.chainId,
    inputCurrency,
    nativeCurrency,
    totalEthPrice,
    nativeCurencyBalance,
    trade?.inputAmount,
    inputCurrencyBalance,
  ])

  useEffect(() => {
    setBagStatus(BagStatus.ADDING_TO_BAG)
  }, [inputCurrency, setBagStatus])

  const switchChain = useSwitchChain()
  const {
    buttonText,
    buttonTextColor,
    disabled,
    warningText,
    warningTextColor,
    helperText,
    helperTextColor,
    handleClick,
    buttonColor,
  } = useMemo((): BuyButtonStateData => {
    if (connected && account.chainId !== UniverseChainId.Mainnet) {
      const handleClick = () => switchChain(UniverseChainId.Mainnet)
      return getBuyButtonStateData(BuyButtonStates.NOT_SUPPORTED_CHAIN, themeColors, handleClick)
    }

    if (sufficientBalance === false) {
      return getBuyButtonStateData(BuyButtonStates.INSUFFICIENT_BALANCE, themeColors)
    }

    if (bagStatus === BagStatus.WARNING) {
      return getBuyButtonStateData(BuyButtonStates.ERROR, themeColors)
    }

    if (!connected) {
      const handleClick = () => {
        accountDrawer.open()
        setBagExpanded({ bagExpanded: false })
      }
      return getBuyButtonStateData(BuyButtonStates.WALLET_NOT_CONNECTED, themeColors, handleClick)
    }

    if (bagStatus === BagStatus.FETCHING_FINAL_ROUTE || bagStatus === BagStatus.CONFIRMING_IN_WALLET) {
      return getBuyButtonStateData(BuyButtonStates.IN_WALLET_CONFIRMATION, themeColors)
    }

    if (bagStatus === BagStatus.PROCESSING_TRANSACTION) {
      return getBuyButtonStateData(BuyButtonStates.PROCESSING_TRANSACTION, themeColors)
    }

    if (usingPayWithAnyToken && tradeState !== TradeState.VALID) {
      if (tradeState === TradeState.INVALID) {
        return getBuyButtonStateData(BuyButtonStates.INVALID_TOKEN_ROUTE, themeColors)
      }

      if (tradeState === TradeState.NO_ROUTE_FOUND) {
        return getBuyButtonStateData(BuyButtonStates.NO_TOKEN_ROUTE_FOUND, themeColors)
      }

      return getBuyButtonStateData(BuyButtonStates.FETCHING_TOKEN_ROUTE, themeColors)
    }

    const allowanceRequired = allowance.state === AllowanceState.REQUIRED
    const handleClick = () => allowanceRequired && allowance.approveAndPermit()

    if (loadingAllowance) {
      return getBuyButtonStateData(BuyButtonStates.LOADING_ALLOWANCE, themeColors, handleClick)
    }

    if (allowanceRequired) {
      if (allowance.isApprovalPending) {
        return getBuyButtonStateData(BuyButtonStates.IN_WALLET_ALLOWANCE_APPROVAL, themeColors, handleClick)
      } else if (allowance.isApprovalLoading) {
        return getBuyButtonStateData(BuyButtonStates.PROCESSING_APPROVAL, themeColors, handleClick)
      } else {
        return getBuyButtonStateData(BuyButtonStates.REQUIRE_APPROVAL, themeColors, handleClick)
      }
    }

    if (bagStatus === BagStatus.CONFIRM_QUOTE) {
      return getBuyButtonStateData(BuyButtonStates.CONFIRM_UPDATED_PRICE, themeColors, fetchAssets)
    }

    if (priceImpact && priceImpact.priceImpactSeverity.type === 'error') {
      return getBuyButtonStateData(
        BuyButtonStates.PRICE_IMPACT_HIGH,
        themeColors,
        fetchAssets,
        usingPayWithAnyToken,
        priceImpact,
      )
    }

    return getBuyButtonStateData(BuyButtonStates.PAY, themeColors, fetchAssets, usingPayWithAnyToken)
  }, [
    connected,
    account.chainId,
    sufficientBalance,
    bagStatus,
    usingPayWithAnyToken,
    tradeState,
    loadingAllowance,
    allowance,
    priceImpact,
    themeColors,
    fetchAssets,
    switchChain,
    accountDrawer,
    setBagExpanded,
  ])

  const traceEventProperties = {
    usd_value: usdcValue?.toExact(),
    using_erc20: !!inputCurrency,
    ...eventProperties,
  }

  return (
    <Flex px="$spacing12">
      <Flex
        borderTopColor="$surface3"
        borderWidth={0}
        borderTopWidth={1}
        borderStyle="solid"
        mx="$spacing16"
        mb="$spacing8"
        py="$spacing12"
        borderBottomLeftRadius="$rounded12"
        borderBottomRightRadius="$rounded12"
      >
        <Flex pt="$spacing4" pb="$spacing16" gap="$spacing4">
          <Flex row justifyContent="space-between" alignItems="flex-start" gap="$spacing8">
            <Flex gap="$spacing4">
              {isSupportedChain && (
                <>
                  <Text variant="body3" color="$neutral2">
                    <Trans i18nKey="swap.payWith" />
                  </Text>
                  <Flex
                    row
                    alignItems="center"
                    gap="$spacing8"
                    cursor="pointer"
                    onPress={() => {
                      if (!bagIsLocked) {
                        setTokenSelectorOpen(true)
                        sendAnalyticsEvent(NFTEventName.NFT_BUY_TOKEN_SELECTOR_CLICKED)
                      }
                    }}
                  >
                    <CurrencyLogo currency={activeCurrency} size={24} />
                    <Text variant="buttonLabel1" fontSize={20}>
                      {activeCurrency?.symbol}
                    </Text>
                    <ChevronDown size={20} color={themeColors.neutral2.val} />
                  </Flex>
                </>
              )}
            </Flex>

            <Flex gap="$spacing4" overflow="hidden">
              <Text variant="body3" color="$neutral2" textAlign="right">
                <Trans i18nKey="swap.total" />
              </Text>
              <InputCurrencyValue
                usingPayWithAnyToken={usingPayWithAnyToken}
                totalEthPrice={totalEthPrice}
                activeCurrency={activeCurrency}
                tradeState={tradeState}
                trade={trade}
              />
            </Flex>
          </Flex>

          <FiatValue
            usdcValue={usdcValue}
            priceImpact={priceImpact}
            tradeState={tradeState}
            usingPayWithAnyToken={usingPayWithAnyToken}
          />
        </Flex>

        <Trace
          logPress
          eventOnTrigger={NFTEventName.NFT_BUY_BAG_PAY}
          element={InterfaceElementName.NFT_BUY_BAG_PAY_BUTTON}
          properties={traceEventProperties}
          logImpression={connected && !disabled}
        >
          {warningText && (
            <Flex row alignItems="center" justifyContent="center" mb={10} gap="$spacing4">
              <AlertTriangle width={14} color={warningTextColor} />
              <Text variant="body3" color={warningTextColor} testID="nft-buy-button-warning">
                {warningText}
              </Text>
            </Flex>
          )}

          {helperText && (
            <Text variant="body3" color={helperTextColor} textAlign="center" mb={10}>
              {helperText}
            </Text>
          )}

          <Button
            size="large"
            emphasis="primary"
            onPress={handleClick}
            isDisabled={disabled || isPending}
            backgroundColor={buttonColor}
            testID="nft-buy-button"
            minHeight={48}
            opacity={disabled || isPending ? 0.6 : 1}
          >
            {isPending && <Loader size="20px" stroke="white" />}
            <Text variant="buttonLabel2" color={buttonTextColor}>
              {buttonText}
            </Text>
          </Button>
        </Trace>
      </Flex>

      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={(currency: Currency) => {
          setInputCurrency(currency.isNative ? undefined : currency)
          if (currency.isToken) {
            sendAnalyticsEvent(NFTEventName.NFT_BUY_TOKEN_SELECTED, {
              token_address: currency.address,
              token_symbol: currency.symbol,
            })
          }
        }}
        selectedCurrency={activeCurrency ?? undefined}
      />
    </Flex>
  )
}
