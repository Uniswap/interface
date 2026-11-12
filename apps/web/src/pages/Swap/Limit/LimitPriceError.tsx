import { Currency } from '@uniswap/sdk-core'
import { Flex, Text, type FlexCompatProps } from '@universe/mycelium'
import { AlertTriangle } from '@universe/mycelium/icons/AlertTriangle'
import type { TFunction } from 'i18next'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LimitPriceErrorType } from '~/pages/Swap/Limit/LimitPriceInputPanel/useCurrentPriceAdjustment'
import { FadePresence, FadePresenceAnimationType } from '~/theme/components/FadePresence/FadePresence'
import { transitions } from '~/theme/styles'

const ErrorContainer = (props: FlexCompatProps): JSX.Element => (
  <Flex
    row
    alignItems="center"
    width="100%"
    gap="$gap12"
    p="$spacing12"
    borderWidth={1}
    borderColor="$surface3"
    borderRadius="$rounded16"
    mt="$spacing4"
    {...props}
  />
)

const LogoContainer = (props: FlexCompatProps): JSX.Element => (
  <Flex
    centered
    width={40}
    height={40}
    borderRadius="$rounded12"
    backgroundColor="$statusCritical2"
    flexShrink={0}
    {...props}
  />
)

// LimitForm's gate for rendering this banner. It normally accompanies a buildable trade, but a
// rejected market-price reference must stay explained even when no trade can be built (no wallet
// connected, prefilled price cleared). Bare `priceError` is deliberately not enough: it is also
// set transiently while a healthy pair's quotes are still loading, and rendering on it alone
// would flash the banner on every fresh pair.
export function shouldShowLimitPriceError({
  priceError,
  hasLimitOrderTrade,
  marketPriceRejected,
}: {
  priceError?: LimitPriceErrorType
  hasLimitOrderTrade: boolean
  marketPriceRejected: boolean
}): boolean {
  return !!priceError && (hasLimitOrderTrade || marketPriceRejected)
}

interface LimitPriceErrorProps {
  priceError: LimitPriceErrorType
  inputCurrency: Currency
  outputCurrency: Currency
  priceInverted: boolean
  priceAdjustmentPercentage?: number
}

function getTitle(
  t: TFunction,
  { inputCurrency, outputCurrency, priceInverted, priceError }: LimitPriceErrorProps,
): ReactNode {
  if (priceError === LimitPriceErrorType.CALCULATION_ERROR) {
    return t('limitPrice.marketPriceNotAvailable.error.title')
  } else if (priceInverted) {
    return t('limitPrice.buyingAboveMarketPrice.error.title', {
      tokenSymbol: outputCurrency.symbol ?? t('common.token'),
    })
  } else {
    return t('limitPrice.sellingBelowMarketPrice.error.title', {
      tokenSymbol: inputCurrency.symbol ?? t('common.token'),
    })
  }
}

function getDescription(
  t: TFunction,
  { priceInverted, priceAdjustmentPercentage, priceError }: LimitPriceErrorProps,
): ReactNode {
  if (priceError === LimitPriceErrorType.CALCULATION_ERROR) {
    return t('limitPrice.marketPriceNotAvailable.error.description')
  } else if (priceInverted && !!priceAdjustmentPercentage) {
    return t('limitPrice.buyingAboveMarketPrice.error.description', {
      percentage: Math.abs(priceAdjustmentPercentage),
    })
  } else if (priceAdjustmentPercentage) {
    return t('limitPrice.sellingBelowMarketPrice.error.description', {
      percentage: Math.abs(priceAdjustmentPercentage),
    })
  }
  return null
}

export function LimitPriceError(props: LimitPriceErrorProps) {
  const { t } = useTranslation()
  return (
    <FadePresence
      transitionDuration={transitions.duration.fast}
      delay={transitions.duration.fast}
      animationType={FadePresenceAnimationType.FadeAndTranslate}
    >
      <ErrorContainer>
        <LogoContainer>
          <AlertTriangle color="$statusCritical" size="$icon.20" strokeWidth={1} />
        </LogoContainer>
        <Flex shrink gap="$gap8">
          <Text variant="subheading2" color="$neutral1">
            {getTitle(t, props)}
          </Text>
          <Text variant="body3" color="$neutral2">
            {getDescription(t, props)}
          </Text>
        </Flex>
      </ErrorContainer>
    </FadePresence>
  )
}
