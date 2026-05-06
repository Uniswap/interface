// oxlint-disable-next-line no-restricted-imports -- Used outside React component context where useTranslation is not available
import { t } from 'i18next'
import { useCallback } from 'react'
import { Flex, Text } from 'ui/src'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { BidMaxValuationSlider } from '~/features/Toucan/Auction/BidForm/BidMaxValuationSlider'
import { MaxValuationFieldState } from '~/features/Toucan/Auction/hooks/useBidMaxValuationField'

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
    tokenValueQ96,
    bidTokenSymbol,
    isFiatMode,
    error,
    errorDetails,
    onChange,
    onTokenValueQ96Change,
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
            valueQ96={tokenValueQ96}
            onChangeQ96={onTokenValueQ96Change}
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
