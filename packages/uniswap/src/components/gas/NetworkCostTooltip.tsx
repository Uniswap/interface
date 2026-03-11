import { FormattedUniswapXGasFeeInfo } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { UniswapXText } from 'ui/src/components/text/UniswapXText'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function NetworkCostTooltip({
  chainId,
  includesDelegation,
}: {
  chainId: UniverseChainId
  includesDelegation: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const learnMoreUrl = includesDelegation
    ? uniswapUrls.helpArticleUrls.smartWalletDelegation
    : uniswapUrls.helpArticleUrls.networkFeeInfo
  const text = includesDelegation
    ? t('smartWallet.banner.networkCost', { chainName: getChainInfo(chainId).label })
    : t('transaction.networkCost.description')
  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{ title: t('common.chain.networkCost', { chain: getChainInfo(chainId).name }) }}
        logo={<NetworkLogo chainId={chainId} size={16} />}
      />
      <Tooltip.Description learnMoreUrl={learnMoreUrl} text={text} />
    </Tooltip.Outer>
  )
}

export function NetworkCostTooltipUniswapX({
  uniswapXGasFeeInfo,
}: {
  uniswapXGasFeeInfo: FormattedUniswapXGasFeeInfo
}): JSX.Element {
  const { t } = useTranslation()
  const { approvalFeeFormatted, swapFeeFormatted, inputTokenSymbol } = uniswapXGasFeeInfo

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{ title: t('swap.warning.networkFee.message.uniswapX.title'), uniswapX: true }}
        Icon={UniswapX}
      />
      <Tooltip.Content>
        <Tooltip.Row>
          <Tooltip.LineItemLabel label={t('transaction.details.networkFee.swap')} />
          <Flex row gap="$spacing6">
            <Text color="$neutral2" textDecorationLine="line-through" variant="body4">
              {swapFeeFormatted}
            </Text>
            <UniswapXText variant="body4">{t('common.free')}</UniswapXText>
          </Flex>
        </Tooltip.Row>
        {approvalFeeFormatted && (
          <Tooltip.Row>
            <Tooltip.LineItemLabel
              label={t('swap.warning.networkFee.allow', { inputTokenSymbol: inputTokenSymbol ?? '' })}
            />
            <Tooltip.LineItemValue value={approvalFeeFormatted} />
          </Tooltip.Row>
        )}
      </Tooltip.Content>
      <Tooltip.Separator />
      <Tooltip.Description learnMoreUrl={uniswapUrls.helpArticleUrls.uniswapXInfo} text={t('uniswapX.cost')} />
    </Tooltip.Outer>
  )
}
