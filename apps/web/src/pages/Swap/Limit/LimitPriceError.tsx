import { Currency } from '@uniswap/sdk-core'
import { ReactNode } from 'react'
import { Trans } from 'react-i18next'
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

function getTitle({ inputCurrency, outputCurrency, priceInverted, priceError }: LimitPriceErrorProps): ReactNode {
  if (priceError === LimitPriceErrorType.CALCULATION_ERROR) {
    return <Trans i18nKey="limitPrice.marketPriceNotAvailable.error.title" />
  } else if (priceInverted) {
    return (
      <Trans i18nKey="limitPrice.buyingAboveMarketPrice.error.title" values={{ tokenSymbol: outputCurrency.symbol }} />
    )
  } else {
    return (
      <Trans i18nKey="limitPrice.sellingBelowMarketPrice.error.title" values={{ tokenSymbol: inputCurrency.symbol }} />
    )
  }
}

function getDescription({ priceInverted, priceAdjustmentPercentage, priceError }: LimitPriceErrorProps): ReactNode {
  if (priceError === LimitPriceErrorType.CALCULATION_ERROR) {
    return (
      <Trans i18nKey="limitPrice.marketPriceNotAvailable.error.description">
        We are unable to calculate the current market price. To avoid submitting an order below market price, please
        check your network connection and try again.
      </Trans>
    )
  } else if (priceInverted && !!priceAdjustmentPercentage) {
    return (
      <Trans
        i18nKey="limitPrice.buyingAboveMarketPrice.error.description"
        values={{ percentage: Math.abs(priceAdjustmentPercentage) }}
      />
    )
  } else if (priceAdjustmentPercentage) {
    return (
      <Trans
        i18nKey="limitPrice.sellingBelowMarketPrice.error.description"
        values={{ percentage: Math.abs(priceAdjustmentPercentage) }}
      />
    )
  }
  return null
}

export function LimitPriceError(props: LimitPriceErrorProps) {
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
        <Flex gap="$gap8">
          <Text variant="subheading2" color="$neutral1">
            {getTitle(props)}
          </Text>
          <Text variant="body3" color="$neutral2">
            {getDescription(props)}
          </Text>
        </Flex>
      </ErrorContainer>
    </FadePresence>
  )
}
