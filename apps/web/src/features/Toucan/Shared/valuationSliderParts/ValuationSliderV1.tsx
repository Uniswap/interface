import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, getContrastPassingTextColor, Text, Tooltip } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import {
  approximateNumberFromRaw,
  computeFdvBidTokenRaw,
  formatCompactFromRaw,
} from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { MARKER_COUNT, TOOLTIP_OPEN_DELAY_MS } from '~/features/Toucan/Shared/valuationSliderParts/constants'
import {
  SliderThumb,
  SliderTrack,
  SliderTrackActive,
  StyledSlider,
} from '~/features/Toucan/Shared/valuationSliderParts/styled'

interface ValuationSliderV1Props {
  disabled?: boolean
  tokenColor?: string
  bidTokenDecimals: number
  bidTokenSymbol: string
  auctionTokenDecimals: number
  tokenTotalSupply?: string
  bidTokenPriceFiat?: number
  sanitizedValueQ96?: bigint
  totalTicks: number
  clampedSliderIndex: number
  progress: number
  onValueChange: (next: number[]) => void
  onPointerDown: () => void
}

export function ValuationSliderV1({
  disabled,
  tokenColor,
  bidTokenDecimals,
  bidTokenSymbol,
  auctionTokenDecimals,
  tokenTotalSupply,
  bidTokenPriceFiat,
  sanitizedValueQ96,
  totalTicks,
  clampedSliderIndex,
  progress,
  onValueChange,
  onPointerDown,
}: ValuationSliderV1Props): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const thumbX = `calc(${-progress * 100}% + ${-2 + progress * 4}px)`
  const textColor = useMemo(() => (tokenColor ? getContrastPassingTextColor(tokenColor) : '$white'), [tokenColor])

  const fdvDisplay = useMemo(() => {
    if (!tokenTotalSupply || !sanitizedValueQ96) {
      return `${0} ${bidTokenSymbol} ${t('stats.fdv')}`.trim()
    }

    try {
      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96: sanitizedValueQ96,
        bidTokenDecimals,
        totalSupplyRaw: tokenTotalSupply,
        auctionTokenDecimals,
      })

      const formattedFdv = formatCompactFromRaw({ raw: fdvRaw, decimals: bidTokenDecimals, maxFractionDigits: 2 })
      return `${formattedFdv} ${bidTokenSymbol} ${t('stats.fdv')}`.trim()
    } catch {
      return `${0} ${bidTokenSymbol} ${t('stats.fdv')}`.trim()
    }
  }, [tokenTotalSupply, auctionTokenDecimals, bidTokenDecimals, bidTokenSymbol, sanitizedValueQ96, t])

  // Fiat FDV for tooltip - shows the FDV in user's fiat currency
  const fiatFdvDisplay = useMemo(() => {
    if (!tokenTotalSupply || !sanitizedValueQ96 || !bidTokenPriceFiat || bidTokenPriceFiat === 0) {
      return null
    }

    try {
      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96: sanitizedValueQ96,
        bidTokenDecimals,
        totalSupplyRaw: tokenTotalSupply,
        auctionTokenDecimals,
      })

      const fdvBidTokenApprox = approximateNumberFromRaw({
        raw: fdvRaw,
        decimals: bidTokenDecimals,
        significantDigits: 15,
      })
      const fdvFiat = fdvBidTokenApprox * bidTokenPriceFiat

      return `${convertFiatAmountFormatted(fdvFiat, NumberType.FiatTokenStats)} ${t('stats.fdv')}`
    } catch {
      return null
    }
  }, [
    tokenTotalSupply,
    auctionTokenDecimals,
    bidTokenDecimals,
    bidTokenPriceFiat,
    convertFiatAmountFormatted,
    sanitizedValueQ96,
    t,
  ])

  return (
    <Flex gap="$spacing8" alignItems="center" width="100%" opacity={disabled ? 0.5 : 1}>
      <StyledSlider
        min={0}
        max={totalTicks}
        step={1}
        value={[clampedSliderIndex]}
        onValueChange={onValueChange}
        onPointerDown={onPointerDown}
        disabled={disabled}
      >
        <SliderTrack>
          <Flex
            position="absolute"
            width="100%"
            height="100%"
            row
            justifyContent="space-between"
            alignItems="center"
            pointerEvents="none"
          >
            {Array.from({ length: MARKER_COUNT }).map((_, i) => (
              <Flex key={i} width={4} height={4} borderRadius="$roundedFull" backgroundColor="$neutral3" />
            ))}
          </Flex>
          <SliderTrackActive style={tokenColor ? { backgroundColor: tokenColor } : undefined} />
        </SliderTrack>
        <SliderThumb index={0} x={thumbX}>
          <Tooltip
            placement="bottom"
            delay={{ open: TOOLTIP_OPEN_DELAY_MS, close: 0 }}
            restMs={TOOLTIP_OPEN_DELAY_MS}
            offset={{ mainAxis: 8 }}
          >
            <Tooltip.Trigger>
              <Flex position="relative" alignItems="center" justifyContent="center">
                <Flex
                  backgroundColor={tokenColor}
                  py="$spacing2"
                  borderRadius="$spacing4"
                  overflow="hidden"
                  minWidth={32}
                  userSelect="none"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Flex px="$spacing4">
                    <Text variant="body4" color={textColor} whiteSpace="noWrap">
                      {fdvDisplay}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Tooltip.Trigger>
            {fiatFdvDisplay && (
              <Tooltip.Content p="$spacing12">
                <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
                  {fiatFdvDisplay}
                </Text>
              </Tooltip.Content>
            )}
          </Tooltip>
        </SliderThumb>
      </StyledSlider>
    </Flex>
  )
}
