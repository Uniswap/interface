import React from 'react'
import { useTranslation } from 'react-i18next'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout/Flex'
import { ToastIcon, ToastVariant } from 'src/components/notifications/Toast'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { Transaction } from 'src/features/dataApi/zerion/types'
import { ElementName } from 'src/features/telemetry/constants'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { getNotificationName } from 'src/features/transactions/utils'
import { shortenAddress } from 'src/utils/addresses'
import { openUri } from 'src/utils/linking'
import { trimToLength } from 'src/utils/string'

// TODO improve this when designs are finalized
export function TransactionSummaryCard({ tx }: { tx: TransactionDetails }) {
  const { t } = useTranslation()

  const onPressHash = () => {
    const explorerUrl = CHAIN_INFO[tx.chainId]?.explorer
    if (!explorerUrl) return
    openUri(`${explorerUrl}/tx/${tx.hash}`)
  }

  let toastVariant: ToastVariant
  if (tx.status === TransactionStatus.Success) {
    toastVariant = ToastVariant.Success
  } else if (tx.status === TransactionStatus.Failed) {
    toastVariant = ToastVariant.Failed
  } else {
    toastVariant = ToastVariant.Pending
  }

  const fromAddress = shortenAddress(tx.from)
  const chainName = CHAIN_INFO[tx.chainId]?.label ?? t('Unknown')

  return (
    <Flex
      alignItems="center"
      borderColor="deprecated_gray200"
      borderRadius="lg"
      borderWidth={1}
      flexDirection="row"
      gap="md"
      justifyContent="space-between"
      p="md">
      <Flex gap="sm">
        <Text variant="body">{getNotificationName(tx, t)}</Text>
        <Text variant="caption">
          {t('From {{addr}} on {{chain}}', { addr: fromAddress, chain: chainName })}
        </Text>
        <TextButton
          name={ElementName.TransactionSummaryHash}
          textVariant="caption"
          onPress={onPressHash}>
          {t('Hash: {{hash}}', { hash: trimToLength(tx.hash, 10) })}
        </TextButton>
      </Flex>
      <ToastIcon variant={toastVariant} />
    </Flex>
  )
}

// TODO: Merge with TransactionSummaryCard when types are compatible
export function HistoricalTransactionSummaryCard({ tx }: { tx: Transaction }) {
  const { t } = useTranslation()

  const onPressHash = () => {
    // TODO: update chain from tx when Zerion supports other chains
    const explorerUrl = CHAIN_INFO[ChainId.Mainnet].explorer
    if (!explorerUrl) return
    openUri(`${explorerUrl}/tx/${tx.hash}`)
  }

  let toastVariant: ToastVariant
  if (tx.status === 'confirmed') {
    toastVariant = ToastVariant.Success
  } else if (tx.status === 'failed') {
    toastVariant = ToastVariant.Failed
  } else {
    toastVariant = ToastVariant.Pending
  }

  const fromAddress = tx.address_from ? shortenAddress(tx.address_from) : null
  const chainName = CHAIN_INFO[ChainId.Mainnet]?.label ?? t('Unknown chain')

  return (
    <Flex
      row
      alignItems="center"
      borderColor="deprecated_gray200"
      borderRadius="lg"
      borderWidth={1}
      gap="md"
      justifyContent="space-between"
      p="md">
      <Flex gap="sm">
        <Text variant="body">{tx.type}</Text>
        {fromAddress ? (
          <Text variant="caption">
            {t('From {{addr}} on {{chain}}', { addr: fromAddress, chain: chainName })}
          </Text>
        ) : null}
        <TextButton
          name={ElementName.TransactionSummaryHash}
          textVariant="caption"
          onPress={onPressHash}>
          {t('Hash: {{hash}}', { hash: trimToLength(tx.hash, 10) })}
        </TextButton>
      </Flex>
      <ToastIcon variant={toastVariant} />
    </Flex>
  )
}
