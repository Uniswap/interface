import { Currency } from '@taraswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/TokenBalancesProvider'
import { Trans } from 'i18n'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { Text } from 'ui/src'

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
}: {
  currency?: Currency
  showCurrencyMessage: boolean
  openCurrencySearchModal: () => void
}) {
  if (!currency || !showCurrencyMessage) {
    return (
      <ThemedText.LabelSmall style={{ userSelect: 'none' }}>
        <Trans i18nKey="limits.price.label" />
      </ThemedText.LabelSmall>
    )
  }
  return (
    <Text variant="body3" userSelect="none" color="$neutral2">
      <Row align="center">
        <Trans i18nKey="limits.whenOne" />{' '}
        <CurrencySymbolContainer>
          <PrefetchBalancesWrapper>
            <TokenSelectorRow gap="xs" align="center" height="100%" onClick={openCurrencySearchModal}>
              <CurrencyLogo currency={currency} size={16} />
              <ThemedText.BodyPrimary display="inline">{currency.symbol}</ThemedText.BodyPrimary>
            </TokenSelectorRow>
          </PrefetchBalancesWrapper>
        </CurrencySymbolContainer>{' '}
        <Trans i18nKey="limits.isWorth" />
      </Row>
    </Text>
  )
}
