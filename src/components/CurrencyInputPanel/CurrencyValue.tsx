import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const FiatLoadingBubble = styled(LoadingBubble)`
  border-radius: 4px;
  width: 4rem;
  height: 1rem;
`

// eslint-disable-next-line import/no-unused-modules
export function CurrencyValue({
  currencyAmount,
}: {
  currencyAmount: { data?: CurrencyAmount<Currency>; isLoading: boolean }
}) {
  const { formatNumber, formatPercent } = useFormatter()

  if (currencyAmount.isLoading) {
    return <FiatLoadingBubble />
  }

  return (
    <Row gap="sm">
      <ThemedText.BodySmall color="neutral2">
        {currencyAmount.data ? (
          formatNumber({
            input: parseFloat(currencyAmount.data.toSignificant(5)),
            type: NumberType.TokenNonTx,
          }).concat(' ' + currencyAmount.data.currency.symbol)
        ) : (
          <MouseoverTooltip text={<Trans>Not enough liquidity to show accurate USD value.</Trans>}>-</MouseoverTooltip>
        )}
      </ThemedText.BodySmall>
    </Row>
  )
}
