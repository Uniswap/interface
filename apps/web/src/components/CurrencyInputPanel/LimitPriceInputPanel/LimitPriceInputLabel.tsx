import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const CurrencySymbolContainer = styled.span`
  display: inline-block;
  margin: 0 8px;
`

export function LimitPriceInputLabel({
  currency,
  showCurrencyMessage,
}: {
  currency?: Currency
  showCurrencyMessage: boolean
}) {
  if (!currency || !showCurrencyMessage) {
    return (
      <ThemedText.LabelSmall style={{ userSelect: 'none' }}>
        <Trans>Limit price</Trans>
      </ThemedText.LabelSmall>
    )
  }
  return (
    <ThemedText.LabelSmall style={{ userSelect: 'none' }}>
      <Row align="center">
        <Trans>When 1</Trans>{' '}
        <CurrencySymbolContainer>
          <Row gap="xs" align="center" height="100%">
            <CurrencyLogo currency={currency} size="16px" />
            <ThemedText.BodyPrimary display="inline">{currency.symbol}</ThemedText.BodyPrimary>
          </Row>
        </CurrencySymbolContainer>{' '}
        <Trans>is worth</Trans>
      </Row>
    </ThemedText.LabelSmall>
  )
}
