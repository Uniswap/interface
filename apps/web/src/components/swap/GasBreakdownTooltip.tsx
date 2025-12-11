import { Currency } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import UniswapXRouterLabel, { UniswapXGradient } from 'components/RouterLabel/UniswapXRouterLabel'
import { deprecatedStyled } from 'lib/styled-components'
import { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { InterfaceTrade } from 'state/routing/types'
import { isPreviewTrade, isUniswapXTrade } from 'state/routing/utils'
import { ThemedText } from 'theme/components'
import { Divider } from 'theme/components/Dividers'
import { ExternalLink } from 'theme/components/Links'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const Container = deprecatedStyled(AutoColumn)`
  padding: 4px;
`

type GasCostItemProps = { title: ReactNode; itemValue?: React.ReactNode; amount?: number }

const GasCostItem = ({ title, amount, itemValue }: GasCostItemProps) => {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  if (!amount && !itemValue) {
    return null
  }

  const value = itemValue ?? convertFiatAmountFormatted(amount, NumberType.FiatGasPrice)
  return (
    <Row justify="space-between">
      <ThemedText.SubHeaderSmall>{title}</ThemedText.SubHeaderSmall>
      <ThemedText.SubHeaderSmall color="neutral1">{value}</ThemedText.SubHeaderSmall>
    </Row>
  )
}

const GaslessSwapLabel = () => {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return <UniswapXRouterLabel>{convertFiatAmountFormatted(0, NumberType.FiatGasPrice)}</UniswapXRouterLabel>
}

type GasBreakdownTooltipProps = { trade: InterfaceTrade }

export function GasBreakdownTooltip({ trade }: GasBreakdownTooltipProps) {
  const isUniswapX = isUniswapXTrade(trade)
  const inputCurrency = trade.inputAmount.currency
  const native = nativeOnChain(inputCurrency.chainId)

  if (isPreviewTrade(trade)) {
    return <NetworkCostDescription native={native} />
  }

  const swapEstimate = !isUniswapX ? trade.gasUseEstimateUSD : undefined
  const approvalEstimate = trade.approveInfo.needsApprove ? trade.approveInfo.approveGasEstimateUSD : undefined
  const wrapEstimate = isUniswapX && trade.wrapInfo.needsWrap ? trade.wrapInfo.wrapGasEstimateUSD : undefined
  const showEstimateDetails = Boolean(wrapEstimate || approvalEstimate)

  const description = isUniswapX ? <UniswapXDescription /> : <NetworkCostDescription native={native} />

  if (!showEstimateDetails) {
    return description
  }

  return (
    <Container gap="md">
      <AutoColumn gap="sm">
        <GasCostItem
          title={<Trans i18nKey="swap.wrap.token" values={{ sym: native.symbol }} />}
          amount={wrapEstimate}
        />
        <GasCostItem
          title={<Trans i18nKey="swap.allow.oneTime" values={{ sym: inputCurrency.symbol }} />}
          amount={approvalEstimate}
        />
        <GasCostItem title={<Trans i18nKey="common.swap" />} amount={swapEstimate} />
        {isUniswapX && <GasCostItem title={<Trans i18nKey="common.swap" />} itemValue={<GaslessSwapLabel />} />}
      </AutoColumn>
      <Divider />
      {description}
    </Container>
  )
}

function NetworkCostDescription({ native }: { native: Currency }) {
  const supportedChain = useSupportedChainId(native.chainId)
  const { defaultChainId } = useEnabledChains()
  const chainName = getChainLabel(supportedChain ?? defaultChainId)

  return (
    <ThemedText.LabelMicro>
      <Trans i18nKey="swap.networkCost.paidIn" values={{ sym: native.symbol, chainName }} />{' '}
      <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8370337377805-What-is-a-network-fee-">
        <Trans i18nKey="common.button.learn" />
      </ExternalLink>
    </ThemedText.LabelMicro>
  )
}

const InlineUniswapXGradient = deprecatedStyled(UniswapXGradient)`
  display: inline;
`
export function UniswapXDescription() {
  return (
    <ThemedText.Caption color="neutral2">
      <Trans
        i18nKey="uniswapX.aggregatesLiquidity"
        components={{
          logo: <InlineUniswapXGradient>UniswapX</InlineUniswapXGradient>,
        }}
      />{' '}
      <ExternalLink href={uniswapUrls.helpArticleUrls.uniswapXInfo}>
        <Trans i18nKey="common.button.learn" />
      </ExternalLink>
    </ThemedText.Caption>
  )
}
