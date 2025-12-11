import { Currency } from '@uniswap/sdk-core'
import { LimitPriceErrorType } from 'components/CurrencyInputPanel/LimitPriceInputPanel/useCurrentPriceAdjustment'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { deprecatedStyled } from 'lib/styled-components'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { FadePresence, FadePresenceAnimationType } from 'theme/components/FadePresence'
import { transitions } from 'theme/styles'
import { useSporeColors } from 'ui/src'

const Container = deprecatedStyled(Row)`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 16px;
  margin-top: 4px;
`

const LogoContainer = deprecatedStyled.div`
  height: 40px;
  width: 40px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.critical2};
  flex-shrink: 0;
`

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
  const colors = useSporeColors()
  return (
    <FadePresence
      $transitionDuration={transitions.duration.fast}
      $delay={transitions.duration.fast}
      animationType={FadePresenceAnimationType.FadeAndTranslate}
    >
      <Container gap="md">
        <LogoContainer>
          <AlertTriangle strokeWidth={1} color={colors.statusCritical.val} size="20px" />
        </LogoContainer>
        <Column>
          <ThemedText.SubHeader>{getTitle(props)}</ThemedText.SubHeader>
          <ThemedText.BodySmall color="neutral2">{getDescription(props)}</ThemedText.BodySmall>
        </Column>
      </Container>
    </FadePresence>
  )
}
