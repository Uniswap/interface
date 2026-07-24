import { Currency } from '@uniswap/sdk-core'
import type { TFunction } from 'i18next'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { LimitPriceErrorType } from '~/features/Swap/CurrencyInputPanel/LimitPriceInputPanel/useCurrentPriceAdjustment'
import { FadePresence, FadePresenceAnimationType } from '~/theme/components/FadePresence'
import { transitions } from '~/theme/styles'

const ErrorContainer = styled(Flex, {
  row: true,
  alignItems: 'center',
  width: '100%',
  gap: '$gap12',
  p: '$spacing12',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded16',
  mt: '$spacing4',
})

const LogoContainer = styled(Flex, {
  centered: true,
  width: 40,
  height: 40,
  borderRadius: '$rounded12',
  backgroundColor: '$statusCritical2',
  flexShrink: 0,
})

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
      $transitionDuration={transitions.duration.fast}
      $delay={transitions.duration.fast}
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
