import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import Column from 'components/Column'
import Row from 'components/Row'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { FadePresence, FadePresenceAnimationType } from 'theme/components/FadePresence'

const Container = styled(Row)`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 16px;
  margin-top: 4px;
`

const LogoContainer = styled.div`
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
  inputCurrency: Currency
  outputCurrency: Currency
  priceInverted: boolean
  priceAdjustmentPercentage: number
}

function getTitle({ inputCurrency, outputCurrency, priceInverted }: LimitPriceErrorProps): ReactNode {
  if (priceInverted) {
    return <Trans>Buying {outputCurrency.symbol} above market price</Trans>
  } else {
    return <Trans>Selling {inputCurrency.symbol} below market price</Trans>
  }
}

function getDescription({ priceInverted, priceAdjustmentPercentage }: LimitPriceErrorProps): ReactNode {
  if (priceInverted) {
    return (
      <Trans>
        Your limit price is {Math.abs(priceAdjustmentPercentage)}% higher than market. Adjust your limit price to
        proceed.
      </Trans>
    )
  } else {
    return (
      <Trans>
        Your limit price is {Math.abs(priceAdjustmentPercentage)}% lower than market. Adjust your limit price to
        proceed.
      </Trans>
    )
  }
}

export function LimitPriceError(props: LimitPriceErrorProps) {
  const theme = useTheme()
  return (
    <FadePresence
      $transitionDuration={theme.transition.duration.fast}
      $delay={theme.transition.duration.fast}
      animationType={FadePresenceAnimationType.FadeAndTranslate}
    >
      <Container gap="md">
        <LogoContainer>
          <AlertTriangle strokeWidth={1} color={theme.critical} size="20px" />
        </LogoContainer>
        <Column>
          <ThemedText.SubHeader>{getTitle(props)}</ThemedText.SubHeader>
          <ThemedText.BodySmall color="neutral2">{getDescription(props)}</ThemedText.BodySmall>
        </Column>
      </Container>
    </FadePresence>
  )
}
