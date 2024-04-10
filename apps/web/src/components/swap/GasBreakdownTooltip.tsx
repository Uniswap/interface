import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import UniswapXRouterLabel, { UniswapXGradient } from 'components/RouterLabel/UniswapXRouterLabel'
import Row from 'components/Row'
import { nativeOnChain } from 'constants/tokens'
import { chainIdToBackendName } from 'graphql/data/util'
import { ReactNode } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { isPreviewTrade, isUniswapXTrade } from 'state/routing/utils'
import styled from 'styled-components'
import { Divider, ExternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const Container = styled(AutoColumn)`
  padding: 4px;
`

type GasCostItemProps = { title: ReactNode; itemValue?: React.ReactNode; amount?: number }

const GasCostItem = ({ title, amount, itemValue }: GasCostItemProps) => {
  const { formatNumber } = useFormatter()

  if (!amount && !itemValue) return null

  const value = itemValue ?? formatNumber({ input: amount, type: NumberType.FiatGasPrice })
  return (
    <Row justify="space-between">
      <ThemedText.SubHeaderSmall>{title}</ThemedText.SubHeaderSmall>
      <ThemedText.SubHeaderSmall color="neutral1">{value}</ThemedText.SubHeaderSmall>
    </Row>
  )
}

const GaslessSwapLabel = () => {
  const { formatNumber } = useFormatter()
  return <UniswapXRouterLabel>{formatNumber({ input: 0, type: NumberType.FiatGasPrice })}</UniswapXRouterLabel>
}

type GasBreakdownTooltipProps = { trade: InterfaceTrade }

export function GasBreakdownTooltip({ trade }: GasBreakdownTooltipProps) {
  const isUniswapX = isUniswapXTrade(trade)
  const inputCurrency = trade.inputAmount.currency
  const native = nativeOnChain(inputCurrency.chainId)

  if (isPreviewTrade(trade)) return <NetworkCostDescription native={native} />

  const swapEstimate = !isUniswapX ? trade.gasUseEstimateUSD : undefined
  const approvalEstimate = trade.approveInfo.needsApprove ? trade.approveInfo.approveGasEstimateUSD : undefined
  const wrapEstimate = isUniswapX && trade.wrapInfo.needsWrap ? trade.wrapInfo.wrapGasEstimateUSD : undefined
  const showEstimateDetails = Boolean(wrapEstimate || approvalEstimate)

  const description = isUniswapX ? <UniswapXDescription /> : <NetworkCostDescription native={native} />

  if (!showEstimateDetails) return description

  return (
    <Container gap="md">
      <AutoColumn gap="sm">
        <GasCostItem title={<Trans>Wrap {native.symbol}</Trans>} amount={wrapEstimate} />
        <GasCostItem title={<Trans>Allow {inputCurrency.symbol} (one time)</Trans>} amount={approvalEstimate} />
        <GasCostItem title={<Trans>Swap</Trans>} amount={swapEstimate} />
        {isUniswapX && <GasCostItem title={<Trans>Swap</Trans>} itemValue={<GaslessSwapLabel />} />}
      </AutoColumn>
      <Divider />
      {description}
    </Container>
  )
}

function NetworkCostDescription({ native }: { native: Currency }) {
  const chainName = chainIdToBackendName(native.chainId)

  return (
    <ThemedText.LabelMicro>
      <Trans>
        Network cost is paid in {native.symbol} on the {chainName} network in order to transact.
      </Trans>{' '}
      <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8370337377805-What-is-a-network-fee-">
        <Trans>Learn more</Trans>
      </ExternalLink>
    </ThemedText.LabelMicro>
  )
}

const InlineUniswapXGradient = styled(UniswapXGradient)`
  display: inline;
`
export function UniswapXDescription() {
  return (
    <ThemedText.Caption color="neutral2">
      <Trans>
        <InlineUniswapXGradient>UniswapX</InlineUniswapXGradient> aggregates liquidity sources for better prices and gas
        free swaps.
      </Trans>{' '}
      <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/17515415311501">
        <Trans>Learn more</Trans>
      </ExternalLink>
    </ThemedText.Caption>
  )
}
