import { providers } from 'ethers'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useGasFeeInfo, useGasPrice } from 'src/features/gas/hooks'
import { EthTransaction } from 'src/features/walletConnect/types'
import { formatPrice } from 'src/utils/format'

export function NetworkFee({
  chainId,
  transaction,
}: {
  chainId: ChainId
  transaction: EthTransaction
}) {
  const { t } = useTranslation()
  const { to, from, value, data, gasPrice, nonce } = transaction

  const tx: providers.TransactionRequest = useMemo(
    () => ({
      to,
      from,
      value,
      data,
      gasPrice,
      nonce,
      chainId,
    }),
    [chainId, data, from, gasPrice, nonce, to, value]
  )

  const gasFeeInfo = useGasFeeInfo(chainId, tx)
  const price = useGasPrice(chainId, gasFeeInfo)

  return (
    <Flex row>
      <Flex grow>
        <Text variant="body2">{t('Network Fee')}</Text>
      </Flex>
      <Text variant="body2">{!gasFeeInfo ? 'Loading...' : formatPrice(price)}</Text>
    </Flex>
  )
}
