import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'
import { UniswapXFee } from 'wallet/src/components/network/NetworkFee'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'

interface NetworkFeeFooterProps {
  chainId: WalletChainId
  showNetworkLogo: boolean
  gasFeeUSD: string | undefined
  isUniswapX?: boolean
}

export function NetworkFeeFooter({
  chainId,
  showNetworkLogo,
  gasFeeUSD,
  isUniswapX,
}: NetworkFeeFooterProps): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const variant = isMobileApp ? 'body3' : 'body4'

  const formattedFiat = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)
  return (
    <Flex px="$spacing8">
      <ContentRow label={t('transaction.networkCost.label')} variant={variant}>
        <Flex centered row gap="$spacing4">
          {showNetworkLogo && <NetworkLogo chainId={chainId} size={iconSizes.icon16} />}
          {isUniswapX ? (
            <UniswapXFee gasFee={formattedFiat} />
          ) : (
            <Text color="$neutral1" variant={variant}>
              {formattedFiat}
            </Text>
          )}
        </Flex>
      </ContentRow>
    </Flex>
  )
}
