import { Trans } from '@lingui/macro'
import { Percent, TradeType } from '@uniswap/sdk-core'
import Column from 'components/Column'
import { RowBetween } from 'components/Row'
import { InterfaceTrade } from 'state/routing/types'
import { ExternalLink, Separator, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const ExactInMessage = ({ amount }: { amount: string }) => (
  <Trans>
    If the price moves so that you will receive less than {amount}, your transaction will be reverted. This is the
    minimum amount you are guaranteed to receive.
  </Trans>
)

const ExactOutMessage = ({ amount }: { amount: string }) => (
  <Trans>
    If the price moves so that you will pay more than {amount}, your transaction will be reverted. This is the maximum
    amount you are guaranteed to pay.
  </Trans>
)

function SlippageHeader({ amount, isExactIn }: { amount: string; isExactIn: boolean }) {
  return (
    <RowBetween>
      <ThemedText.Caption color="neutral1">
        {isExactIn ? <Trans>Receive at least</Trans> : <Trans>Pay at most</Trans>}
      </ThemedText.Caption>
      <ThemedText.Caption color="neutral1">{amount}</ThemedText.Caption>
    </RowBetween>
  )
}

export function MaxSlippageTooltip({ trade, allowedSlippage }: { trade: InterfaceTrade; allowedSlippage: Percent }) {
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const amount = isExactIn ? trade.minimumAmountOut(allowedSlippage) : trade.maximumAmountIn(allowedSlippage)

  const formattedAmount = useFormatter().formatCurrencyAmount({ amount, type: NumberType.SwapDetailsAmount })
  const displayAmount = `${formattedAmount} ${amount.currency.symbol}`

  return (
    <Column gap="xs">
      <SlippageHeader amount={displayAmount} isExactIn={isExactIn} />
      <Separator />
      <div>
        {isExactIn ? <ExactInMessage amount={displayAmount} /> : <ExactOutMessage amount={displayAmount} />}{' '}
        <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8643879653261-What-is-Price-Slippage-">
          Learn more
        </ExternalLink>
      </div>
    </Column>
  )
}
