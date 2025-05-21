import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { NetworkLogoWarning } from 'uniswap/src/components/CurrencyLogo/NetworkLogoWarning'

export interface NetworkInfo {
  chainId: number
  name: string
  nativeCurrency: string
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
    <Flex
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      flexDirection="row"
      justifyContent="space-between"
      py="$spacing8"
    >
      <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
        <NetworkLogoWarning chainId={networkInfo.chainId} />
        <Flex shrink alignItems="flex-start">
          <Text ellipsizeMode="tail" numberOfLines={1} variant="body2">
            {networkInfo.name}
          </Text>
        </Flex>
      </Flex>
      <Flex justifyContent="space-between" position="relative">
        <Flex centered fill>
          {!networkInfo.hasSufficientFunds ? (
            <Text color="$neutral2" variant="body3">
              {t('smartWallet.InsufficientFunds.network.disable.text')}
            </Text>
          ) : (
            <Text color="$statusCritical" variant="body3">
              {t('smartWallet.InsufficientFunds.network.text', {
                nativeCurrency: networkInfo.nativeCurrency,
              })}
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
})
