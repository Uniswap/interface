import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useAllTransactionsBetweenAddresses } from 'wallet/src/features/transactions/hooks/useAllTransactionsBetweenAddresses'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

interface RecipientInputPanelProps {
  recipientAddress: string
  onShowRecipientSelector: () => void
}

/**
 * Panel displaying currently selected recipient metadata as well as a toggle
 * to open the recipient selector modal.
 */
export function RecipientInputPanel({
  recipientAddress,
  onShowRecipientSelector,
}: RecipientInputPanelProps): JSX.Element {
  const onPressRecipient = (): void => {
    dismissNativeKeyboard()
    onShowRecipientSelector()
  }

  return (
    <TouchableArea px="$spacing32" py="$spacing16" testID={TestID.SelectRecipient} onPress={onPressRecipient}>
      <Flex centered gap="$spacing4" py="$spacing12">
        <AddressDisplay
          hideAddressInSubtitle
          centered
          address={recipientAddress}
          displayNameTextAlign="center"
          variant="heading3"
          flexGrow={false}
        />
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
      {t('send.recipient.previous', { count: prevTxnsCount })}
    </Text>
  )
}
