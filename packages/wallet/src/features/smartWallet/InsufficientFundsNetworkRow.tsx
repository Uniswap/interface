import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { NetworkLogoWarning } from 'uniswap/src/components/CurrencyLogo/NetworkLogoWarning'
import { GasFeeResultWithoutState } from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'

export interface NetworkInfo {
  chainId: number
  name: string
  nativeCurrency: string
  gasFee: GasFeeResultWithoutState
  hasSufficientFunds: boolean
}

interface InsufficientFundsNetworkRowProps {
  networkInfo: NetworkInfo
}

export const InsufficientFundsNetworkRow = memo(function _InsufficientFundsNetworkRow({
  networkInfo,
}: InsufficientFundsNetworkRowProps) {
  const { t } = useTranslation()

  return (
    <Flex backgroundColor="$surface1" borderRadius="$rounded16" flexDirection="row" justifyContent="space-between">
      <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
        <NetworkLogoWarning hasSufficientFunds={networkInfo.hasSufficientFunds} chainId={networkInfo.chainId} />
        <Flex shrink alignItems="flex-start">
          <Text ellipsizeMode="tail" numberOfLines={1} variant="body2">
            {networkInfo.name}
          </Text>
        </Flex>
      </Flex>
      <Flex justifyContent="space-between" position="relative">
        <Flex centered fill>
          {!networkInfo.hasSufficientFunds ? (
            <Text color="$statusCritical" variant="body3">
              {t('smartWallet.insufficientFunds.network.text', {
                nativeCurrency: networkInfo.nativeCurrency,
              })}
            </Text>
          ) : (
            <Text color="$neutral2" variant="body3">
              {t('smartWallet.insufficientFunds.network.disable.text')}
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
})
