import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const InputCurencySymbolContainer = styled.span`
  display: inline-block;
  margin: 0 8px;
`

export function LimitPriceInputLabel({
  inputCurrency,
  showCurrencyMessage,
}: {
  inputCurrency?: Currency
  showCurrencyMessage: boolean
}) {
  if (!inputCurrency || !showCurrencyMessage) {
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
        <InputCurencySymbolContainer>
          <Row gap="xs" align="center" height="100%">
            <CurrencyLogo currency={inputCurrency} size="16px" />
            <ThemedText.BodyPrimary display="inline">{inputCurrency.symbol}</ThemedText.BodyPrimary>
          </Row>
        </InputCurencySymbolContainer>{' '}
        <Trans>is worth</Trans>
      </Row>
    </ThemedText.LabelSmall>
  )
}
