import { useEffect, useMemo, useState } from 'react'
import { Flex, styled, Text, TouchableArea } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { X } from 'ui/src/components/icons/X'
import { AdaptiveWebModal } from 'ui/src/components/modal/AdaptiveWebModal'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/utils/getTradeAmounts'
import { calculateRateLine, getRateToDisplay } from 'uniswap/src/features/transactions/swap/utils/trade'
import { formatPriceImpact } from 'uniswap/src/features/transactions/swap/utils/formatPriceImpact'
import { getPriceImpact } from 'uniswap/src/features/transactions/swap/utils/getPriceImpact'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
import { useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { isWebPlatform } from 'utilities/src/platform'

const ModalContainer = styled(Flex, {
  width: 440,
  backgroundColor: '#1A1B23',
  borderWidth: 1,
  borderColor: '#545C69',
  borderRadius: 0,
  flexDirection: 'column',
  p: 0,
  overflow: 'hidden',
  '$platform-web': {
    boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    borderRadius: '0 !important',
    margin: '0 !important',
    padding: '0 !important',
  },
})

const Header = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: 8,
  px: 12,
  width: '100%',
  height: 50,
  borderBottomWidth: 1,
  borderBottomColor: '#545C69',
  borderRadius: 0,
})

const Content = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  p: 0,
  pt: 18,
  gap: 10,
  width: '100%',
})

const TokenRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  height: 67,
  gap: 18,
})

const TokenInfo = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 4,
  width: 133.85,
  height: 67,
})

const FeesSection = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'flex-start',
  px: 18,
  gap: 16,
  width: '100%',
  alignSelf: 'stretch',
})

const FeeRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  height: 21,
})

interface SwapConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
}

export function SwapConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  derivedSwapInfo,
}: SwapConfirmationModalProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const { formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()
  const priceUXEnabled = usePriceUXEnabled()
  const { inputCurrencyAmount, outputCurrencyAmount } = getTradeAmounts(derivedSwapInfo, priceUXEnabled)

  const formattedTokenAmountIn = useMemo(
    () =>
      inputCurrencyAmount
        ? formatCurrencyAmount({
            value: inputCurrencyAmount,
            type: NumberType.TokenTx,
          })
        : '0',
    [formatCurrencyAmount, inputCurrencyAmount],
  )

  const formattedTokenAmountOut = useMemo(
    () =>
      outputCurrencyAmount
        ? formatCurrencyAmount({
            value: outputCurrencyAmount,
            type: NumberType.TokenTx,
          })
        : '0',
    [formatCurrencyAmount, outputCurrencyAmount],
  )

  const usdAmountIn = useUSDCValue(inputCurrencyAmount)
  const usdAmountOut = useUSDCValue(outputCurrencyAmount)
  const formattedFiatAmountIn = useMemo(
    () => convertFiatAmountFormatted(usdAmountIn?.toExact(), NumberType.FiatTokenQuantity),
    [convertFiatAmountFormatted, usdAmountIn],
  )
  const formattedFiatAmountOut = useMemo(
    () => convertFiatAmountFormatted(usdAmountOut?.toExact(), NumberType.FiatTokenQuantity),
    [convertFiatAmountFormatted, usdAmountOut],
  )

  const inputCurrency = inputCurrencyAmount?.currency
  const outputCurrency = outputCurrencyAmount?.currency

  // Get currencies from SwapFormScreenStore (the actual currencies shown in the form)
  const formCurrencies = useSwapFormScreenStore((s) => s.currencies)
  const sellCurrencyInfo = formCurrencies[CurrencyField.INPUT] ?? undefined
  // Use buy currency from form if available, otherwise fallback to derivedSwapInfo
  const buyCurrencyInfo =
    formCurrencies[CurrencyField.OUTPUT] ?? derivedSwapInfo.currencies[CurrencyField.OUTPUT] ?? undefined

  // Calculate rate from trade
  const trade = derivedSwapInfo.trade.trade
  const formatter = useLocalizationContext()
  const { formatPercent } = formatter
  const rateText = useMemo(() => {
    if (!trade) {
      return null
    }
    const rate = getRateToDisplay({ formatter, trade, showInverseRate: false })
    const rateAmountUSD = calculateRateLine({
      usdAmountOut,
      outputCurrencyAmount,
      trade,
      showInverseRate: false,
      formatter,
    })
    return rateAmountUSD ? `${rate} (${rateAmountUSD})` : rate
  }, [trade, formatter, usdAmountOut, outputCurrencyAmount])

  // Get slippage tolerance from settings - prioritize settings over trade to ensure immediate sync
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const autoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((s) => s.autoSlippageTolerance)
  // Prioritize customSlippageTolerance or autoSlippageTolerance from settings (these update immediately)
  // Fallback to trade.slippageTolerance only if settings are not available
  const slippageTolerance = customSlippageTolerance ?? autoSlippageTolerance ?? trade?.slippageTolerance ?? 0
  const slippageText = useMemo(() => {
    // If customSlippageTolerance is set, don't show "Auto" prefix (user has customized it)
    // Otherwise, show "Auto" prefix for auto-calculated slippage
    if (customSlippageTolerance) {
      return formatPercent(slippageTolerance)
    }
    return `Auto ${formatPercent(slippageTolerance)}`
  }, [customSlippageTolerance, slippageTolerance, formatPercent])

  // Calculate price impact from trade
  const priceImpact = getPriceImpact(derivedSwapInfo)
  const priceImpactText = useMemo(() => {
    if (!priceImpact) {
      return 'N/A'
    }
    return formatPriceImpact(priceImpact, formatter.formatPercent)
  }, [priceImpact, formatter.formatPercent])

  // Get gas fee from swapTxStore
  const { gasFee } = useSwapTxStore((s) => ({
    gasFee: s.gasFee,
  }))
  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId: derivedSwapInfo.chainId,
    placeholder: undefined,
  })

  // Get swap fee info
  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)
  const swapFee = trade?.swapFee
  const feeText = useMemo(() => {
    if (!swapFee || swapFee.percent.equalTo(0)) {
      return 'Free'
    }
    // If USD value is available, show it, otherwise show percentage
    if (swapFeeUsd !== undefined && !isNaN(swapFeeUsd)) {
      return convertFiatAmountFormatted(swapFeeUsd, NumberType.FiatGasPrice) ?? formatPercent(swapFee.percent.toFixed())
    }
    return formatPercent(swapFee.percent.toFixed())
  }, [swapFee, swapFeeUsd, convertFiatAmountFormatted, formatPercent])

  // Get routing provider name
  const routingProvider = useRoutingProvider({ routing: trade?.routing })
  const routingText = useMemo(() => {
    if (!trade?.routing) {
      return 'N/A'
    }
    // For CLASSIC routing, use provider name (e.g., "Uniswap API")
    // For other routing types, you might want to customize the display
    if (routingProvider?.name) {
      return routingProvider.name
    }
    // Fallback: return routing type as string
    return trade.routing
  }, [trade?.routing, routingProvider])

  // TokenRow component
  interface TokenRowProps {
    currencyInfo: CurrencyInfo | undefined
    amount: string
    fiatAmount: string
    paddingX: number
    hasValidData: boolean
  }

  function TokenRowComponent({ currencyInfo, amount, fiatAmount, paddingX, hasValidData }: TokenRowProps): JSX.Element {
    return (
      <TokenRow px={paddingX}>
        <TokenInfo>
          <Text
            style={{
              fontFamily: "'Aleo', sans-serif",
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: 28,
              lineHeight: 42,
              color: '#FFFFFF',
            }}
          >
            {amount}
          </Text>
          <Text
            style={{
              fontFamily: "'Aleo', sans-serif",
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 21,
              color: '#64748B',
            }}
          >
            {fiatAmount}
          </Text>
        </TokenInfo>
        {hasValidData && currencyInfo ? (
          <CurrencyLogo currencyInfo={currencyInfo} size={42} />
        ) : (
          <Flex width={42} height={42} backgroundColor="$surface2" borderRadius={21} />
        )}
      </TokenRow>
    )
  }

  // Force-remove any rounding/overflow applied by Radix/Tamagui wrappers
  useEffect(() => {
    if (!isOpen) {
      return
    }
    const content = document.querySelector('[data-radix-dialog-content]')
    if (content) {
      const parent = content.parentElement as HTMLElement | null
      const grand = parent?.parentElement as HTMLElement | null
      const apply = (el: HTMLElement | null) => {
        if (!el) return
        el.style.borderRadius = '0'
        el.style.overflow = 'visible'
        el.style.boxShadow = 'none'
        el.style.margin = '0'
        el.style.padding = '0'
        el.style.background = 'transparent'
        el.style.maxWidth = 'none'
        el.style.width = 'auto'
      }
      apply(parent)
      apply(grand)
    }
  }, [isOpen])

  // Don't render modal if it's not open
  if (!isOpen) {
    return <></>
  }

  // If currencies are missing, still show modal but with placeholder data
  const hasValidData = inputCurrency && outputCurrency && sellCurrencyInfo && buyCurrencyInfo

  const modalContent = (
    <ModalContainer
      style={{
        borderRadius: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Header>
        <Text
          style={{
            fontFamily: "'Aleo', sans-serif",
            fontStyle: 'normal',
            fontWeight: 500,
            fontSize: 18,
            lineHeight: 27,
            color: '#FFFFFF',
          }}
        >
          You're swapping
        </Text>
        <TouchableArea width={32} height={32} onPress={onClose}>
          <Flex alignItems="center" justifyContent="center" width={32} height={32}>
            <X color="#94A3B8" size={24} />
          </Flex>
        </TouchableArea>
      </Header>

      <Content>
        <Flex flexDirection="column" gap={18} width="100%" alignItems="flex-start">
          {/* Sell Token (Input) */}
          <TokenRowComponent
            currencyInfo={sellCurrencyInfo}
            amount={formattedTokenAmountIn}
            fiatAmount={formattedFiatAmountIn}
            paddingX={24}
            hasValidData={!!sellCurrencyInfo}
          />

          {/* Arrow */}
          <Flex alignItems="center" justifyContent="center" width="100%" px={18}>
            <Flex
              width={16}
              height={16}
              alignItems="center"
              justifyContent="center"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <Chevron color="#94A3B8" size={16} />
            </Flex>
          </Flex>

          {/* Buy Token (Output) */}
          <TokenRowComponent
            currencyInfo={buyCurrencyInfo}
            amount={formattedTokenAmountOut}
            fiatAmount={formattedFiatAmountOut}
            paddingX={18}
            hasValidData={!!buyCurrencyInfo}
          />
        </Flex>

        {/* Fees Section */}
        <FeesSection>
          <Flex flexDirection="row" alignItems="center" gap={16} width="100%" height={20} py={0}>
            <Flex flex={1} height={1} backgroundColor="#545C69" />
            <TouchableArea
              style={{
                width: 98,
                height: 20,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onPress={() => setIsExpanded((prev) => !prev)}
            >
              <Text
                style={{
                  fontFamily: "'Aleo', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: 20,
                  color: '#94A3B8',
                  whiteSpace: 'nowrap',
                }}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Text>
              <Flex
                width={16}
                height={16}
                alignItems="center"
                justifyContent="center"
                style={{
                  transform: isExpanded ? 'rotate(-90deg)' : 'rotate(90deg)',
                }}
              >
                <Chevron color="#94A3B8" size={16} />
              </Flex>
            </TouchableArea>
            <Flex flex={1} height={1} backgroundColor="#545C69" />
          </Flex>

          <Flex flexDirection="column" gap={12} width="100%">
            <Flex flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
              <Flex flexDirection="row" alignItems="center" gap={6}>
                <Text
                  style={{
                    fontFamily: "'Aleo', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 500,
                    fontSize: 14,
                    lineHeight: 21,
                    color: '#94A3B8',
                  }}
                >
                  Fee
                </Text>
                <InfoCircle color="#94A3B8" size={16} />
              </Flex>
              <Text
                style={{
                  fontFamily: "'Aleo', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: 21,
                  color: '#AD81F1',
                }}
              >
                {feeText}
              </Text>
            </Flex>

            <Flex flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
              <Flex flexDirection="row" alignItems="center" gap={6}>
                <Text
                  style={{
                    fontFamily: "'Aleo', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 500,
                    fontSize: 14,
                    lineHeight: 21,
                    color: '#94A3B8',
                  }}
                >
                  Network cost
                </Text>
                <InfoCircle color="#94A3B8" size={16} />
              </Flex>
              <Flex flexDirection="row" alignItems="center" gap={6}>
                <Text
                  style={{
                    fontFamily: "'Aleo', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 500,
                    fontSize: 14,
                    lineHeight: 21,
                    color: '#FFFFFF',
                  }}
                >
                  {gasFeeFormatted ?? 'N/A'}
                </Text>
              </Flex>
            </Flex>

            {isExpanded && (
              <>
                <Flex flexDirection="row" alignItems="center" justifyContent="space-between" width="100%" gap={0}>
                  <Flex flexDirection="row" alignItems="center" gap={6}>
                    <Text
                      style={{
                        fontFamily: "'Aleo', sans-serif",
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: 20,
                        color: '#94A3B8',
                      }}
                    >
                      Rate
                    </Text>
                  </Flex>
                  <Text
                    style={{
                      fontFamily: "'Aleo', sans-serif",
                      fontStyle: 'normal',
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: 20,
                      color: '#FFFFFF',
                    }}
                  >
                    {rateText ?? 'N/A'}
                  </Text>
                </Flex>

                <Flex flexDirection="row" alignItems="center" justifyContent="space-between" width="100%" gap={0}>
                  <Flex flexDirection="row" alignItems="center" gap={6}>
                    <Text
                      style={{
                        fontFamily: "'Aleo', sans-serif",
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: 20,
                        color: '#94A3B8',
                      }}
                    >
                      Max slippage
                    </Text>
                    <InfoCircle color="#94A3B8" size={16} />
                  </Flex>
                  <Text
                    style={{
                      fontFamily: "'Aleo', sans-serif",
                      fontStyle: 'normal',
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: 20,
                      color: '#FFFFFF',
                    }}
                  >
                    {slippageText}
                  </Text>
                </Flex>

                <Flex flexDirection="row" alignItems="center" justifyContent="space-between" width="100%" gap={0}>
                  <Flex flexDirection="row" alignItems="center" gap={6}>
                    <Text
                      style={{
                        fontFamily: "'Aleo', sans-serif",
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: 20,
                        color: '#94A3B8',
                      }}
                    >
                      Order routing
                    </Text>
                    <InfoCircle color="#94A3B8" size={16} />
                  </Flex>
                  <Text
                    style={{
                      fontFamily: "'Aleo', sans-serif",
                      fontStyle: 'normal',
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: 20,
                      color: '#FFFFFF',
                    }}
                  >
                    {routingText}
                  </Text>
                </Flex>

                <Flex flexDirection="row" alignItems="center" justifyContent="space-between" width="100%" gap={0}>
                  <Flex flexDirection="row" alignItems="center" gap={6}>
                    <Text
                      style={{
                        fontFamily: "'Aleo', sans-serif",
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: 20,
                        color: '#94A3B8',
                      }}
                    >
                      Price impact
                    </Text>
                    <InfoCircle color="#94A3B8" size={16} />
                  </Flex>
                  <Text
                    style={{
                      fontFamily: "'Aleo', sans-serif",
                      fontStyle: 'normal',
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: 20,
                      color: '#FFFFFF',
                    }}
                  >
                    {priceImpactText}
                  </Text>
                </Flex>
              </>
            )}
          </Flex>
        </FeesSection>

        {/* Swap Button */}
        <Flex mt={8} px={18} pb={18} width="100%" alignItems="center">
          <TouchableArea
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 18px',
              width: 404,
              height: 60,
              background: 'linear-gradient(90.87deg, #2362DD -1.27%, #2C7FDD 47.58%, #AD81F1 99.78%)',
              boxShadow: '0px 0px 20px -5px rgba(35, 98, 221, 0.5)',
              borderRadius: 12,
            }}
            onPress={onConfirm}
          >
            <Text
              style={{
                fontFamily: "'Aleo', sans-serif",
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: 18,
                lineHeight: 28,
                color: '#FFFFFF',
                textAlign: 'center',
              }}
            >
              Swap Tokens
            </Text>
          </TouchableArea>
        </Flex>
      </Content>
    </ModalContainer>
  )

  return (
    <>
      {/* Global CSS to override Dialog.Content border radius and padding */}
      {isOpen && (
        <style>
          {`
            [data-radix-dialog-content],
            [data-radix-dialog-content] > div:first-child,
            [data-radix-dialog-content] > div:first-child > div {
              border-radius: 0 !important;
              background: transparent !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              max-width: none !important;
              width: auto !important;
              overflow: visible !important;
            }
            [data-radix-dialog-content] * {
              border-radius: 0 !important;
            }
          `}
        </style>
      )}

      {isWebPlatform ? (
        <AdaptiveWebModal
          isOpen={isOpen}
          alignment="center"
          adaptToSheet={false}
          borderWidth={0}
          backgroundColor="$transparent"
          style={{
            borderRadius: 0,
            boxShadow: 'none',
            margin: 0,
            padding: 0,
            maxWidth: 'none',
            width: 'auto',
            overflow: 'visible',
          }}
          onClose={onClose}
        >
          {modalContent}
        </AdaptiveWebModal>
      ) : (
        <Modal
          name={ModalName.ConfirmSwap}
          isModalOpen={isOpen}
          alignment="center"
          maxWidth={440}
          height="auto"
          padding={0}
          paddingX={0}
          paddingY={0}
          pt={0}
          pb={0}
          hideHandlebar={true}
          borderWidth={0}
          onClose={onClose}
        >
          {modalContent}
        </Modal>
      )}
    </>
  )
}
