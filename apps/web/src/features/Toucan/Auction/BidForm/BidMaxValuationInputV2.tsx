import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { CurrencyField } from 'uniswap/src/types/currency'
import { formatUnits, parseUnits } from '~/chains'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { priceToQ96WithDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { BidMaxValuationSlider } from '~/features/Toucan/Auction/BidForm/BidMaxValuationSlider'
import type { MaxValuationFieldState } from '~/features/Toucan/Auction/hooks/useBidMaxValuationField'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { computeFdvBidTokenRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { ValuationInputType } from '~/features/Toucan/Shared/ValuationSlider'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'

interface BidMaxValuationInputV2Props {
  label: string
  field: MaxValuationFieldState
  auctionTokenDecimals?: number
  tokenColor?: string
  disabled?: boolean
}

const CUSTOM_PANEL_STYLE = {
  backgroundColor: '$surface2',
  borderRadius: '$rounded20',
  paddingVertical: '$spacing12',
} as const

/**
 * V2 of the max valuation input — the input field shows FDV (fully diluted valuation)
 * while the slider thumb shows the token price. Internally the field hook still works
 * with token price; this component converts at the display boundary.
 */
export function BidMaxValuationInputV2({
  label,
  field,
  auctionTokenDecimals = 18,
  tokenColor,
  disabled,
}: BidMaxValuationInputV2Props): JSX.Element {
  const { t } = useTranslation()
  const tokenTotalSupply = useAuctionStore((state) => state.auctionDetails?.tokenTotalSupply)
  const {
    currencyAmount,
    currencyInfo,
    tokenValue,
    tokenValueQ96,
    bidTokenSymbol,
    isFiatMode,
    error,
    errorDetails,
    onTokenValueChange,
    onTokenValueQ96Change,
    onToggleFiatMode,
    setSkipBlurSnap,
  } = field

  const bidCurrency = currencyAmount?.currency ?? currencyInfo?.currency
  const bidTokenDecimals = bidCurrency?.decimals

  const { fiatToToken: fiatToBidToken, tokenToFiat: bidTokenToFiat } = useFiatTokenConversion({
    currency: bidCurrency,
  })

  const [localFdvInput, setLocalFdvInput] = useState<string | null>(null)

  // Compute bid-token FDV from the current token price (source of truth from hook)
  const fdvBidTokenValue = useMemo(() => {
    if (!tokenValue || !tokenTotalSupply || bidTokenDecimals === undefined) {
      return ''
    }
    try {
      const tokenPriceRaw = parseUnits(tokenValue, bidTokenDecimals)
      if (tokenPriceRaw === 0n) {
        return ''
      }
      const priceQ96 = priceToQ96WithDecimals({
        priceRaw: tokenPriceRaw,
        auctionTokenDecimals,
      })
      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96,
        bidTokenDecimals,
        totalSupplyRaw: tokenTotalSupply,
        auctionTokenDecimals,
      })
      return formatUnits(fdvRaw, bidTokenDecimals)
    } catch {
      return ''
    }
  }, [tokenValue, tokenTotalSupply, bidTokenDecimals, auctionTokenDecimals])

  // Compute fiat FDV from bid-token FDV (for display when isFiatMode and not typing)
  const fdvFiatValue = useMemo(() => {
    if (!fdvBidTokenValue) {
      return ''
    }
    return bidTokenToFiat(fdvBidTokenValue) ?? ''
  }, [fdvBidTokenValue, bidTokenToFiat])

  // Display value: user's local edit, or derived FDV in the active mode
  const displayValue = localFdvInput ?? (isFiatMode ? fdvFiatValue : fdvBidTokenValue)

  // CurrencyAmount for secondary display — always represents bid-token FDV
  const fdvBidTokenCurrencyAmount = useMemo(
    () => (fdvBidTokenValue && bidCurrency ? tryParseCurrencyAmount(fdvBidTokenValue, bidCurrency) : undefined),
    [fdvBidTokenValue, bidCurrency],
  )
  const fdvUsdValue = useUSDCValue(fdvBidTokenCurrencyAmount)

  // Convert FDV (in bid tokens) → token price
  const fdvToTokenPrice = useCallback(
    (fdvInput: string): string | null => {
      if (!fdvInput || !tokenTotalSupply || bidTokenDecimals === undefined) {
        return null
      }
      try {
        const fdvRaw = parseUnits(fdvInput, bidTokenDecimals)
        if (fdvRaw === 0n) {
          return '0'
        }
        const tokenTotalSupplyRaw = BigInt(tokenTotalSupply)
        if (tokenTotalSupplyRaw === 0n) {
          return null
        }
        // tokenPriceRaw = fdvRaw * 10^auctionTokenDecimals / tokenTotalSupplyRaw
        const tokenPriceRaw = (fdvRaw * 10n ** BigInt(auctionTokenDecimals)) / tokenTotalSupplyRaw
        return formatUnits(tokenPriceRaw, bidTokenDecimals)
      } catch {
        return null
      }
    },
    [tokenTotalSupply, bidTokenDecimals, auctionTokenDecimals],
  )

  const handleFdvChange = useCallback(
    (amount: string) => {
      setLocalFdvInput(amount)

      // In fiat mode, CurrencyInputPanel passes a fiat string — convert to bid-token FDV first
      const fdvInBidToken = isFiatMode ? fiatToBidToken(amount) : amount
      if (fdvInBidToken === null) {
        return
      }

      const tokenPrice = fdvToTokenPrice(fdvInBidToken)
      if (tokenPrice !== null) {
        onTokenValueChange(tokenPrice)
      }
    },
    [isFiatMode, fiatToBidToken, fdvToTokenPrice, onTokenValueChange],
  )

  const handleBlur = useCallback(() => {
    setLocalFdvInput(null)
    field.onBlur()
  }, [field])

  const handleSliderInteractionStart = useCallback(() => {
    setLocalFdvInput(null)
    setSkipBlurSnap(true)
  }, [setSkipBlurSnap])

  const handleToggleFiatMode = useCallback(() => {
    setLocalFdvInput(null)
    onToggleFiatMode()
  }, [onToggleFiatMode])

  return (
    <Flex gap="$spacing4">
      <CurrencyInputPanel
        currencyField={CurrencyField.INPUT}
        headerLabel={label}
        value={displayValue}
        currencyAmount={fdvBidTokenCurrencyAmount ?? undefined}
        currencyBalance={undefined}
        currencyInfo={currencyInfo}
        usdValue={fdvUsdValue}
        onSetExactAmount={handleFdvChange}
        onToggleIsFiatMode={handleToggleFiatMode}
        isFiatMode={isFiatMode}
        hidePresets
        customPanelStyle={CUSTOM_PANEL_STYLE}
        onBlur={handleBlur}
        disablePressAnimation
        disabled={disabled}
        allowOverflow
        panelAccessory={
          <BidMaxValuationSlider
            valueQ96={tokenValueQ96}
            onChangeQ96={onTokenValueQ96Change}
            bidTokenDecimals={bidTokenDecimals}
            bidTokenSymbol={bidTokenSymbol}
            tokenColor={tokenColor}
            disabled={disabled}
            onInteractionStart={handleSliderInteractionStart}
            inputType={ValuationInputType.Fdv}
          />
        }
        fontSizeOptions={{ maxFontSize: 18, minFontSize: 12 }}
        fiatValueVariant="body4"
        inputRowPaddingVertical="$none"
        inputRowMinHeight={32}
        panelAccessoryPaddingTop="$spacing8"
        inputSuffix={!isFiatMode && bidTokenSymbol ? bidTokenSymbol : undefined}
      />
      {error &&
        (errorDetails ? (
          <Flex row alignItems="baseline" flexWrap="wrap" gap="$spacing4">
            <Text variant="body4" color="$statusCritical">
              {t('toucan.bidForm.yourFdvOf')}
            </Text>
            <SubscriptZeroPrice
              value={errorDetails.inputValueDecimal}
              symbol={bidTokenSymbol}
              variant="body4"
              color="$statusCritical"
            />
            <Text variant="body4" color="$statusCritical">
              {t('toucan.bidForm.isBelowMinimumOf')}
            </Text>
            <SubscriptZeroPrice
              value={errorDetails.minValueDecimal}
              symbol={bidTokenSymbol}
              variant="body4"
              color="$statusCritical"
            />
          </Flex>
        ) : (
          <Text variant="body4" color="$statusCritical">
            {error}
          </Text>
        ))}
    </Flex>
  )
}
