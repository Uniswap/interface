import { t } from 'i18next'
import { useCallback } from 'react'
import { Flex, Text } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyField } from 'uniswap/src/types/currency'
import { BidMaxValuationSlider } from '~/components/Toucan/Auction/BidForm/BidMaxValuationSlider'
import { MaxValuationFieldState } from '~/components/Toucan/Auction/hooks/useBidMaxValuationField'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'

interface BidMaxValuationInputProps {
  label: string
  field: MaxValuationFieldState
  totalSupply?: string
  auctionTokenDecimals?: number
  tokenColor?: string
  disabled?: boolean
}

const CUSTOM_PANEL_STYLE = {
  backgroundColor: '$surface2',
  borderRadius: '$rounded20',
  paddingVertical: '$spacing12',
} as const

export function BidMaxValuationInput({ label, field, tokenColor, disabled }: BidMaxValuationInputProps): JSX.Element {
  const {
    currencyAmount,
    currencyInfo,
    usdValue,
    value,
    tokenValue,
    bidTokenSymbol,
    isFiatMode,
    error,
    errorDetails,
    onChange,
    onTokenValueChange,
    onBlur,
    onToggleFiatMode,
    setSkipBlurSnap,
  } = field

  const bidTokenDecimals = currencyAmount?.currency.decimals ?? currencyInfo?.currency.decimals

  const handleSliderInteractionStart = useCallback(() => {
    setSkipBlurSnap(true)
  }, [setSkipBlurSnap])

  return (
    <Flex gap="$spacing4">
      <CurrencyInputPanel
        currencyField={CurrencyField.INPUT}
        headerLabel={label}
        value={value}
        currencyAmount={currencyAmount ?? undefined}
        currencyBalance={undefined}
        currencyInfo={currencyInfo}
        usdValue={usdValue}
        onSetExactAmount={onChange}
        onToggleIsFiatMode={onToggleFiatMode}
        isFiatMode={isFiatMode}
        hidePresets
        customPanelStyle={CUSTOM_PANEL_STYLE}
        onBlur={onBlur}
        disablePressAnimation
        disabled={disabled}
        allowOverflow
        panelAccessory={
          <BidMaxValuationSlider
            value={tokenValue}
            onChange={onTokenValueChange}
            bidTokenDecimals={bidTokenDecimals}
            bidTokenSymbol={bidTokenSymbol}
            tokenColor={tokenColor}
            disabled={disabled}
            onInteractionStart={handleSliderInteractionStart}
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
