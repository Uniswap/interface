import { t, Trans } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { InterfaceTrade } from 'state/routing/types'
import { isClassicTrade, isUniswapXTrade } from 'state/routing/utils'
import styled from 'styled-components/macro'
import { Divider, ThemedText } from 'theme'

const Container = styled(AutoColumn)`
  padding: 4px;
`

const InlineLink = styled(ThemedText.Caption)`
  color: ${({ theme }) => theme.accentAction};
  display: inline;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`

const GasCostItem = ({ title, amount }: { title: string; amount: number }) => {
  return (
    <Row justify="space-between">
      <ThemedText.SubHeaderSmall>
        <Trans>{title}</Trans>
      </ThemedText.SubHeaderSmall>
      <ThemedText.SubHeaderSmall color="textPrimary">
        {formatNumber(amount, NumberType.FiatGasPrice)}
      </ThemedText.SubHeaderSmall>
    </Row>
  )
}

export function GasBreakdownTooltip({ trade }: { trade: InterfaceTrade }) {
  const swapEstimate = isClassicTrade(trade) ? trade.gasUseEstimateUSD : undefined
  const approvalEstimate = trade.approveInfo.needsApprove ? trade.approveInfo.approveGasEstimateUSD : undefined
  const wrapEstimate =
    isUniswapXTrade(trade) && trade.wrapInfo.needsWrap ? trade.wrapInfo.wrapGasEstimateUSD : undefined
  return (
    <Container gap="md">
      <AutoColumn gap="sm">
        {wrapEstimate && <GasCostItem title={t`Wrap ETH`} amount={wrapEstimate} />}
        {approvalEstimate && (
          <GasCostItem title={t`Allow ${trade.inputAmount.currency.symbol} (one time)`} amount={approvalEstimate} />
        )}
        {swapEstimate && <GasCostItem title={t`Swap`} amount={swapEstimate} />}
      </AutoColumn>
      <Divider />
      <ThemedText.Caption color="textSecondary">
        Network Fees are paid to the Ethereum network to secure transactions. <InlineLink>Learn more</InlineLink>
      </ThemedText.Caption>
    </Container>
  )
}
