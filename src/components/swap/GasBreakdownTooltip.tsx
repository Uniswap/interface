import { t, Trans } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { AutoColumn } from 'components/Column'
import UniswapXRouterLabel, { UniswapXGradient } from 'components/RouterLabel/UniswapXRouterLabel'
import Row from 'components/Row'
import { InterfaceTrade } from 'state/routing/types'
import { isClassicTrade, isUniswapXTrade } from 'state/routing/utils'
import styled from 'styled-components/macro'
import { Divider, ExternalLink, ThemedText } from 'theme'

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

const InlineUniswapXGradient = styled(UniswapXGradient)`
  display: inline;
`

const GasCostItem = ({ title, amount, itemValue }: { title: string; itemValue?: React.ReactNode; amount?: number }) => {
  return (
    <Row justify="space-between">
      <ThemedText.SubHeaderSmall>
        <Trans>{title}</Trans>
      </ThemedText.SubHeaderSmall>
      <ThemedText.SubHeaderSmall color="textPrimary">
        {itemValue ?? formatNumber(amount, NumberType.FiatGasPrice)}
      </ThemedText.SubHeaderSmall>
    </Row>
  )
}

export function GasBreakdownTooltip({
  trade,
  hideFees = false,
  hideUniswapXDescription = false,
}: {
  trade: InterfaceTrade
  hideFees?: boolean
  hideUniswapXDescription?: boolean
}) {
  const swapEstimate = isClassicTrade(trade) ? trade.gasUseEstimateUSD : undefined
  const approvalEstimate = trade.approveInfo.needsApprove ? trade.approveInfo.approveGasEstimateUSD : undefined
  const wrapEstimate =
    isUniswapXTrade(trade) && trade.wrapInfo.needsWrap ? trade.wrapInfo.wrapGasEstimateUSD : undefined
  return (
    <Container gap="md">
      {(wrapEstimate || approvalEstimate) && !hideFees && (
        <>
          <AutoColumn gap="sm">
            {wrapEstimate && <GasCostItem title={t`Wrap ETH`} amount={wrapEstimate} />}
            {approvalEstimate && (
              <GasCostItem title={t`Allow ${trade.inputAmount.currency.symbol} (one time)`} amount={approvalEstimate} />
            )}
            {swapEstimate && <GasCostItem title={t`Swap`} amount={swapEstimate} />}
            {isUniswapXTrade(trade) && (
              <GasCostItem title={t`Swap`} itemValue={<UniswapXRouterLabel>$0</UniswapXRouterLabel>} />
            )}
          </AutoColumn>
          <Divider />
        </>
      )}
      {isUniswapXTrade(trade) && !hideUniswapXDescription ? (
        <ThemedText.Caption color="textSecondary">
          <InlineUniswapXGradient>UniswapX</InlineUniswapXGradient> aggregates onchain and offchain orders for better
          prices and lower network fees.
        </ThemedText.Caption>
      ) : (
        <ThemedText.Caption color="textSecondary">
          Network Fees are paid to the Ethereum network to secure transactions.{' '}
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8370337377805-What-is-a-network-fee-">
            <InlineLink>Learn more</InlineLink>
          </ExternalLink>
        </ThemedText.Caption>
      )}
    </Container>
  )
}
