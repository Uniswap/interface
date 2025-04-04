import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { isMobileApp } from 'utilities/src/platform'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'

interface NetworkFeeFooterProps {
  chainId: UniverseChainId
  showNetworkLogo: boolean
  gasFee: GasFeeResult | undefined
  isUniswapX?: boolean
}

export function NetworkFeeFooter({
  chainId,
  showNetworkLogo,
  gasFee,
  isUniswapX,
}: NetworkFeeFooterProps): JSX.Element | null {
  const { t } = useTranslation()
  const variant = isMobileApp ? 'body3' : 'body4'

  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: '-',
  })

  return (
    <Flex px="$spacing8">
      <ContentRow label={t('transaction.networkCost.label')} variant={variant}>
        <Flex centered row gap="$spacing4">
          {showNetworkLogo && <NetworkLogo chainId={chainId} size={iconSizes.icon16} />}
          {isUniswapX ? (
            <UniswapXFee gasFee={gasFeeFormatted} />
          ) : (
            <Text color="$neutral1" variant={variant}>
              {gasFeeFormatted}
            </Text>
          )}
        </Flex>
      </ContentRow>
    </Flex>
  )
}
