import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import PrefetchBalancesWrapper from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import Row from 'components/Row'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'

const CurrencySymbolContainer = styled.span`
  display: inline-block;
  margin: 0 8px;
`

const TokenSelectorRow = styled(Row)`
  ${ClickableStyle}
`

export function LimitPriceInputLabel({
  currency,
  showCurrencyMessage,
  openCurrencySearchModal,
  currencySearchModalOpen,
}: {
  currency?: Currency
  showCurrencyMessage: boolean
  currencySearchModalOpen: boolean
  openCurrencySearchModal: () => void
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
          <PrefetchBalancesWrapper shouldFetchOnAccountUpdate={currencySearchModalOpen}>
            <TokenSelectorRow gap="xs" align="center" height="100%" onClick={openCurrencySearchModal}>
              <CurrencyLogo currency={currency} size="16px" />
              <ThemedText.BodyPrimary display="inline">{currency.symbol}</ThemedText.BodyPrimary>
            </TokenSelectorRow>
          </PrefetchBalancesWrapper>
        </CurrencySymbolContainer>{' '}
        <Trans>is worth</Trans>
      </Row>
    </ThemedText.LabelSmall>
  )
}
