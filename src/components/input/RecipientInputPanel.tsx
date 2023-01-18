import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'

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
  const theme = useAppTheme()

  return (
    <TouchableArea
      name={ElementName.SelectRecipient}
      p="xs"
      onPress={onToggleShowRecipientSelector}>
      <Flex gap="xxxs">
        <Flex centered row gap="xxs">
          <AddressDisplay
            hideAddressInSubtitle
            address={recipientAddress}
            variant="headlineSmall"
          />
          <Chevron color={theme.colors.textPrimary} direction="e" />
        </Flex>
        {recipientAddress && <RecipientPrevTransfers recipient={recipientAddress} />}
      </Flex>
    </TouchableArea>
  )
}

export function RecipientPrevTransfers({ recipient }: { recipient: string }): JSX.Element {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()
  const prevTxns = useAllTransactionsBetweenAddresses(activeAddress, recipient).length

  return (
    <Text color="textSecondary" textAlign="center" variant="bodySmall">
      {prevTxns === 1
        ? t('{{ prevTxns }} previous transfer', { prevTxns })
        : t('{{ prevTxns }} previous transfers', { prevTxns })}
    </Text>
  )
}
