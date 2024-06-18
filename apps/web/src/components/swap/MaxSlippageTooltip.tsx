import { Percent, TradeType } from '@taraswap/sdk-core'
import Column from 'components/Column'
import { RowBetween } from 'components/Row'
import { Trans } from 'i18n'
import { InterfaceTrade } from 'state/routing/types'
import { ExternalLink, Separator, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const ExactInMessage = ({ amount }: { amount: string }) => (
  <Trans i18nKey="swap.slippage.exactIn.revert" values={{ amount }} />
)

const ExactOutMessage = ({ amount }: { amount: string }) => (
  <Trans i18nKey="swap.slippage.exactOut.revert" values={{ amount }} />
)

function SlippageHeader({ amount, isExactIn }: { amount: string; isExactIn: boolean }) {
  return (
    <RowBetween>
      <ThemedText.Caption color="neutral1">
        {isExactIn ? <Trans i18nKey="swap.receive.atLeast" /> : <Trans i18nKey="swap.payAtMost" />}
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
          <Trans i18nKey="common.learnMore.link" />
        </ExternalLink>
      </div>
    </Column>
  )
}
