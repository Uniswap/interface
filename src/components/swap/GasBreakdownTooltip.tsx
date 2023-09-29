import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import UniswapXRouterLabel, { UniswapXGradient } from 'components/RouterLabel/UniswapXRouterLabel'
import Row from 'components/Row'
import { ReactNode } from 'react'
import { SubmittableTrade } from 'state/routing/types'
import { isClassicTrade, isUniswapXTrade } from 'state/routing/utils'
import styled from 'styled-components'
import { Divider, ExternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const Container = styled(AutoColumn)`
  padding: 4px;
`

const InlineLink = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.accent1};
  display: inline;
  cursor: pointer;
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

const InlineUniswapXGradient = styled(UniswapXGradient)`
  display: inline;
`

const GasCostItem = ({
  title,
  amount,
  itemValue,
}: {
  title: ReactNode
  itemValue?: React.ReactNode
  amount?: number
}) => {
  const { formatNumber } = useFormatter()

  return (
    <Row justify="space-between">
      <ThemedText.SubHeaderSmall>{title}</ThemedText.SubHeaderSmall>
      <ThemedText.SubHeaderSmall color="neutral1">
        {itemValue ??
          formatNumber({
            input: amount,
            type: NumberType.FiatGasPrice,
          })}
      </ThemedText.SubHeaderSmall>
    </Row>
  )
}

export function GasBreakdownTooltip({
  trade,
  hideFees = false,
  hideUniswapXDescription = false,
}: {
  trade: SubmittableTrade
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
            {wrapEstimate && <GasCostItem title={<Trans>Wrap ETH</Trans>} amount={wrapEstimate} />}
            {approvalEstimate && (
              <GasCostItem
                title={<Trans>Allow {trade.inputAmount.currency.symbol} (one time)</Trans>}
                amount={approvalEstimate}
              />
            )}
            {swapEstimate && <GasCostItem title={<Trans>Swap</Trans>} amount={swapEstimate} />}
            {isUniswapXTrade(trade) && (
              <GasCostItem title={<Trans>Swap</Trans>} itemValue={<UniswapXRouterLabel>$0</UniswapXRouterLabel>} />
            )}
          </AutoColumn>
          <Divider />
        </>
      )}
      {isUniswapXTrade(trade) && !hideUniswapXDescription ? (
        <ThemedText.BodySmall color="neutral2">
          <Trans>
            <InlineUniswapXGradient>UniswapX</InlineUniswapXGradient> aggregates liquidity sources for better prices and
            gas free swaps.
          </Trans>{' '}
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/17515415311501">
            <InlineLink>
              <Trans>Learn more</Trans>
            </InlineLink>
          </ExternalLink>
        </ThemedText.BodySmall>
      ) : (
        <ThemedText.BodySmall color="neutral2">
          <Trans>Network Fees are paid to the Ethereum network to secure transactions.</Trans>{' '}
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8370337377805-What-is-a-network-fee-">
            <InlineLink>
              <Trans>Learn more</Trans>
            </InlineLink>
          </ExternalLink>
        </ThemedText.BodySmall>
      )}
    </Container>
  )
}
