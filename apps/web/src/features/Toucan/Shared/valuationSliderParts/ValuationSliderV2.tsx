import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Slider, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import {
  MARKER_COUNT,
  THUMB_LABEL_OFFSET,
  V2_THUMB_SIZE,
  V2_TRACK_HEIGHT,
} from '~/features/Toucan/Shared/valuationSliderParts/constants'
import { SliderThumbUnstyled, StyledSlider } from '~/features/Toucan/Shared/valuationSliderParts/styled'

interface ValuationSliderV2Props {
  value: string
  disabled?: boolean
  tokenColor?: string
  bidTokenSymbol: string
  bidTokenPriceFiat?: number
  totalTicks: number
  clampedSliderIndex: number
  progress: number
  onValueChange: (next: number[]) => void
  onPointerDown: () => void
}

export function ValuationSliderV2({
  value,
  disabled,
  tokenColor,
  bidTokenSymbol,
  bidTokenPriceFiat,
  totalTicks,
  clampedSliderIndex,
  progress,
  onValueChange,
  onPointerDown,
}: ValuationSliderV2Props): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const containerRef = useRef<HTMLDivElement>(null)

  // Token price as a number for SubscriptZeroPrice rendering
  const tokenPriceNum = useMemo(() => {
    const num = parseFloat(value)
    return num && Number.isFinite(num) ? num : 0
  }, [value])

  // Token price in fiat for the label
  const tokenPriceFiatDisplay = useMemo(() => {
    if (!bidTokenPriceFiat || bidTokenPriceFiat === 0 || !tokenPriceNum) {
      return null
    }
    const priceFiat = tokenPriceNum * bidTokenPriceFiat
    return convertFiatAmountFormatted(priceFiat, NumberType.FiatTokenPrice)
  }, [tokenPriceNum, bidTokenPriceFiat, convertFiatAmountFormatted])

  const getIndexFromClientX = (clientX: number): number => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || totalTicks === 0) {
      return 0
    }
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(fraction * totalTicks)
  }

  const handlePointerDown = (e: PointerEvent): void => {
    if (disabled) {
      return
    }
    containerRef.current?.setPointerCapture(e.pointerId)
    onPointerDown()
    onValueChange([getIndexFromClientX(e.clientX)])
  }

  const handlePointerMove = (e: PointerEvent): void => {
    if (!containerRef.current?.hasPointerCapture(e.pointerId)) {
      return
    }
    onValueChange([getIndexFromClientX(e.clientX)])
  }

  return (
    <Flex gap="$spacing8" alignItems="center" width="100%" opacity={disabled ? 0.5 : 1} pb="$spacing32">
      {/* Slider container — no overflow hidden so thumb isn't clipped */}
      <Flex
        ref={containerRef as React.RefObject<HTMLDivElement>}
        width="100%"
        height={V2_TRACK_HEIGHT}
        position="relative"
        cursor={disabled ? 'default' : 'pointer'}
        // Tamagui's Flex types onPointerDown/Move with RN's PointerEvent; handlers are DOM-typed.
        // Cast through (event: unknown) => void to satisfy the prop without losing type safety
        // inside the handlers themselves.
        onPointerDown={handlePointerDown as unknown as (event: unknown) => void}
        onPointerMove={handlePointerMove as unknown as (event: unknown) => void}
      >
        {/* Visual track background — overflow hidden for rounded clipping */}
        <Flex
          position="absolute"
          width="100%"
          height="100%"
          backgroundColor="$surface3"
          borderRadius="$roundedFull"
          overflow="hidden"
        >
          {/* Active fill — extends to thumb center + half thumb, clipped by parent */}
          {tokenColor && (
            <Flex
              position="absolute"
              left={0}
              top={0}
              height="100%"
              style={{
                backgroundColor: tokenColor,
                width: `calc(${progress * 100}% + ${V2_THUMB_SIZE / 2}px)`,
                borderRadius: 9999,
              }}
            />
          )}
        </Flex>
        {/* Dot markers */}
        <Flex
          position="absolute"
          width="100%"
          height="100%"
          row
          justifyContent="space-between"
          alignItems="center"
          pointerEvents="none"
          px="$spacing12"
          zIndex={1}
        >
          {Array.from({ length: MARKER_COUNT }).map((_, i) => (
            <Flex key={i} width={4} height={4} borderRadius="$roundedFull" backgroundColor="$neutral3" />
          ))}
        </Flex>
        {/* Slider — visual only (pointerEvents none); interaction handled by the container above */}
        <StyledSlider
          min={0}
          max={totalTicks}
          step={1}
          value={[clampedSliderIndex]}
          onValueChange={onValueChange}
          disabled={disabled}
          backgroundColor="transparent"
          width="100%"
          height={V2_TRACK_HEIGHT}
          zIndex={2}
          style={{ pointerEvents: 'none' }}
        >
          <Slider.Track style={{ background: 'none', backgroundColor: 'transparent' }} />
          <SliderThumbUnstyled index={0}>
            <Flex position="relative">
              <Flex
                width={V2_THUMB_SIZE}
                height={V2_THUMB_SIZE}
                borderRadius="$roundedFull"
                backgroundColor="$neutral1"
              />
              {/* Positioned label below the thumb — uses a regular Flex instead of
                  Tooltip to avoid portaling to the body, which causes the label
                  to render above modals. */}
              <Flex
                position="absolute"
                top={V2_THUMB_SIZE + THUMB_LABEL_OFFSET}
                {...(progress < 0.5 ? { left: -4 } : { right: -4 })}
                pointerEvents="none"
                style={{ width: 'max-content' }}
              >
                {/* Arrow up — rotated square, bottom half hidden behind the label box */}
                <Flex
                  width="$spacing8"
                  height="$spacing8"
                  backgroundColor="$surface1"
                  borderTopWidth="$spacing1"
                  borderLeftWidth="$spacing1"
                  borderColor="$surface3"
                  mb={-5}
                  zIndex={1}
                  style={{
                    transform: 'rotate(45deg)',
                    marginLeft: progress < 0.5 ? 6 : 'auto',
                    marginRight: progress < 0.5 ? 'auto' : 6,
                  }}
                />
                <Flex
                  row
                  backgroundColor="$surface1"
                  borderWidth="$spacing1"
                  borderColor="$surface3"
                  borderRadius="$rounded6"
                  p="$spacing8"
                  alignItems="center"
                  gap="$spacing4"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                    {t('toucan.bidDistribution.legend.tokenPrice')}:
                  </Text>
                  {tokenPriceFiatDisplay ? (
                    <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                      {tokenPriceFiatDisplay}
                    </Text>
                  ) : (
                    <SubscriptZeroPrice
                      value={tokenPriceNum}
                      symbol={bidTokenSymbol}
                      variant="body4"
                      color="$neutral2"
                    />
                  )}
                </Flex>
              </Flex>
            </Flex>
          </SliderThumbUnstyled>
        </StyledSlider>
      </Flex>
    </Flex>
  )
}
