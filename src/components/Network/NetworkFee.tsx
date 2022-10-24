import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useUSDGasPrice } from 'src/features/gas/hooks'
import { formatUSDGasPrice } from 'src/utils/format'

export function NetworkFee({ chainId, gasFee }: { chainId: ChainId; gasFee?: string }) {
  const { t } = useTranslation()
  const gasFeeUSD = useUSDGasPrice(chainId, gasFee)
  const showNetworkPill = chainId !== ChainId.Mainnet

  return (
    <Flex row alignContent="center" justifyContent="space-between" p="md">
      <Text variant="subheadSmall">{t('Network fee')}</Text>
      <Flex row gap="none" justifyContent="flex-end">
        {gasFeeUSD ? (
          <Flex row alignItems="center" gap="xs">
            {showNetworkPill && (
              <Flex row alignItems="center" gap="xs">
                <InlineNetworkPill chainId={chainId} height={20} />
                <Text variant="subheadSmall">•</Text>
              </Flex>
            )}
            <Text variant="subheadSmall">{formatUSDGasPrice(gasFeeUSD)}</Text>
          </Flex>
        ) : (
          <Flex width="50%">
            <Loading type="text" />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
