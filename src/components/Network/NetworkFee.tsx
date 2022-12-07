import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useUSDValue } from 'src/features/gas/hooks'
import { formatUSDPrice, NumberType } from 'src/utils/format'

export function NetworkFee({ chainId, gasFee }: { chainId: ChainId; gasFee?: string }) {
  const { t } = useTranslation()
  const gasFeeUSD = useUSDValue(chainId, gasFee)
  const showNetworkPill = chainId !== ChainId.Mainnet

  return (
    <Flex row alignItems="center" justifyContent="space-between" p="md">
      <Text variant="subheadSmall">{t('Network fee')}</Text>
      <Flex row gap="none" justifyContent="flex-end">
        <Flex row alignItems="center" gap="xs">
          {gasFeeUSD && showNetworkPill ? (
            <Flex row alignItems="center" gap="xs">
              <InlineNetworkPill chainId={chainId} />
              <Text variant="subheadSmall">•</Text>
            </Flex>
          ) : null}
          <Text loading={!gasFeeUSD} variant="subheadSmall">
            {formatUSDPrice(gasFeeUSD, NumberType.FiatGasPrice)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
