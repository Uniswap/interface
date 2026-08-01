import { Currency } from '@uniswap/sdk-core'
import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { UniswapXRouterLabel, UniswapXGradient } from '~/pages/Swap/Limit/RouterLabel/UniswapXRouterLabel'
import { InterfaceTrade } from '~/state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTrade } from '~/state/routing/utils'
import { Divider } from '~/theme/components/Dividers'
import { ExternalLink } from '~/theme/components/Links'

type GasCostItemProps = { title: ReactNode; itemValue?: React.ReactNode; amount?: number }

const GasCostItem = ({ title, amount, itemValue }: GasCostItemProps) => {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  if (!amount && !itemValue) {
    return null
  }

  const value = itemValue ?? convertFiatAmountFormatted(amount, NumberType.FiatGasPrice)
  return (
    <Flex row width="100%" justifyContent="space-between" alignItems="center">
      <Text variant="body3" color="$neutral1">
        {title}
      </Text>
      <Text variant="body3" color="$neutral1">
        {value}
      </Text>
    </Flex>
  )
}

const GaslessSwapLabel = () => {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return <UniswapXRouterLabel>{convertFiatAmountFormatted(0, NumberType.FiatGasPrice)}</UniswapXRouterLabel>
}

type GasBreakdownTooltipProps = { trade: InterfaceTrade }

export function GasBreakdownTooltip({ trade }: GasBreakdownTooltipProps) {
  const { t } = useTranslation()
  const isUniswapX = isUniswapXTrade(trade)
  const inputCurrency = trade.inputAmount.currency
  const native = nativeOnChain(inputCurrency.chainId)

  if (isPreviewTrade(trade)) {
    return <NetworkCostDescription native={native} />
  }

  const swapEstimate = !isUniswapX ? trade.gasUseEstimateUSD : undefined
  const approvalEstimate = trade.approveInfo.needsApprove ? trade.approveInfo.approveGasEstimateUSD : undefined
  // Limit orders still require wrapping ETH to WETH (unlike regular UniswapX swaps which now support native ETH)
  const wrapEstimate = isLimitTrade(trade) && trade.wrapInfo.needsWrap ? trade.wrapInfo.wrapGasEstimateUSD : undefined
  const showEstimateDetails = Boolean(wrapEstimate || approvalEstimate)

  const description = isUniswapX ? <UniswapXDescription /> : <NetworkCostDescription native={native} />

  if (!showEstimateDetails) {
    return description
  }

  return (
    <Flex gap="$gap12" p="$spacing4">
      <Flex gap="$gap8">
        <GasCostItem title={t('swap.wrap.token', { sym: native.symbol ?? t('common.token') })} amount={wrapEstimate} />
        <GasCostItem
          title={t('swap.allow.oneTime', { sym: inputCurrency.symbol ?? t('common.token') })}
          amount={approvalEstimate}
        />
        <GasCostItem title={t('common.swap')} amount={swapEstimate} />
        {isUniswapX && <GasCostItem title={t('common.swap')} itemValue={<GaslessSwapLabel />} />}
      </Flex>
      <Divider />
      {description}
    </Flex>
  )
}

function NetworkCostDescription({ native }: { native: Currency }) {
  const { t } = useTranslation()
  const supportedChain = useSupportedChainId(native.chainId)
  const { defaultChainId } = useEnabledChains()
  const chainName = getChainLabel(supportedChain ?? defaultChainId)

  return (
    <Text variant="body4" color="$neutral2">
      {t('swap.networkCost.paidIn', { sym: native.symbol ?? t('common.token'), chainName })}{' '}
      <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8370337377805-What-is-a-network-fee-">
        {t('common.button.learn')}
      </ExternalLink>
    </Text>
  )
}

const InlineUniswapXGradient = styled(UniswapXGradient, {
  display: 'inline',
})

export function UniswapXDescription() {
  const { t } = useTranslation()
  return (
    <Text variant="body4" color="$neutral2">
      <Trans
        i18nKey="uniswapX.aggregatesLiquidity"
        components={{
          logo: <InlineUniswapXGradient>UniswapX</InlineUniswapXGradient>,
        }}
      />{' '}
      <ExternalLink href={UniswapHelpUrls.articles.uniswapXInfo}>{t('common.button.learn')}</ExternalLink>
    </Text>
  )
}
