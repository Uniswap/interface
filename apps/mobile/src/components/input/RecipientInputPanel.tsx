import React from 'react'
import { useTranslation } from 'react-i18next'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { ElementName } from 'src/features/telemetry/constants'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

interface RecipientInputPanelProps {
  recipientAddress: string
  onToggleShowRecipientSelector: () => void
}

/**
 * Panel displaying currently selected recipient metadata as well as a toggle
 * to open the recipient selector modal.
 */
export function RecipientInputPanel({
  recipientAddress,
  onToggleShowRecipientSelector,
}: RecipientInputPanelProps): JSX.Element {
  return (
    <TouchableArea
      px="$spacing32"
      py="$spacing16"
      testID={ElementName.SelectRecipient}
      onPress={onToggleShowRecipientSelector}>
      <Flex gap="$spacing8" py="$spacing24">
        <Flex centered row gap="$spacing4">
          <AddressDisplay hideAddressInSubtitle address={recipientAddress} variant="heading3" />
          <Icons.RotatableChevron color="$neutral1" direction="end" />
        </Flex>

        {recipientAddress && <RecipientPrevTransfers recipient={recipientAddress} />}
      </Flex>
    </TouchableArea>
  )
}

export function RecipientPrevTransfers({ recipient }: { recipient: string }): JSX.Element {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()
  const previousTransactions = useAllTransactionsBetweenAddresses(activeAddress, recipient)
  const prevTxnsCount = previousTransactions?.length ?? 0

  return (
    <Text color="$neutral2" textAlign="center" variant="subheading2">
      {prevTxnsCount === 1
        ? t('{{ prevTxnsCount }} previous transfer', { prevTxnsCount })
        : t('{{ prevTxnsCount }} previous transfers', { prevTxnsCount })}
    </Text>
  )
}
