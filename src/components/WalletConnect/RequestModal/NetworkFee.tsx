import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useUSDGasPrice } from 'src/features/gas/hooks'
import { FeeInfo } from 'src/features/gas/types'
import { EthTransaction } from 'src/features/walletConnect/types'
import { formatPrice } from 'src/utils/format'

export function NetworkFee({
  chainId,
  gasFeeInfo,
}: {
  chainId: ChainId
  transaction: EthTransaction
  gasFeeInfo: FeeInfo | undefined
}) {
  const { t } = useTranslation()
  const price = useUSDGasPrice(chainId, gasFeeInfo?.fee.normal)

  return (
    <Flex row>
      <Flex grow>
        <Text variant="body2">{t('Network Fee')}</Text>
      </Flex>
      <Text variant="body2">{!gasFeeInfo ? 'Loading...' : formatPrice(price)}</Text>
    </Flex>
  )
}
