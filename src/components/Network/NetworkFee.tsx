import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useUSDGasPrice } from 'src/features/gas/hooks'
import { formatUSDGasPrice } from 'src/utils/format'

export function NetworkFee({ chainId, gasFee }: { chainId: ChainId; gasFee?: string }) {
  const { t } = useTranslation()
  const gasFeeUSD = formatUSDGasPrice(useUSDGasPrice(chainId, gasFee))
  const showNetworkPill = chainId !== ChainId.Mainnet

  return (
    <Flex row alignContent="center" justifyContent="space-between" p="md">
      <Text variant="subheadSmall">{t('Network fee')}</Text>
      <Flex row gap="none">
        {showNetworkPill && <InlineNetworkPill chainId={chainId} height={20} marginRight="lg" />}
        {gasFeeUSD ? <Text variant="subheadSmall">{gasFeeUSD}</Text> : <SpinningLoader />}
      </Flex>
    </Flex>
  )
}
