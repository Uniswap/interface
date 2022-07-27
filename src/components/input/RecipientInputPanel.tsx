import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { FormattedAddress } from 'src/components/text/FormattedAddress'
import { Unicon } from 'src/components/unicons/Unicon'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { ElementName } from 'src/features/telemetry/constants'
import { useNumTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

interface RecipientInputPanelProps {
  recipientAddress?: string
  setRecipientAddress: (newRecipient: string) => void
}

/**
 * Panel displaying currently selected recipient metadata as well as a toggle
 * to open the recipient selector modal.
 */
export function RecipientInputPanel({
  recipientAddress,
  setRecipientAddress,
}: RecipientInputPanelProps) {
  const theme = useAppTheme()

  return (
    <Flex centered gap="sm">
      <Button
        bg={recipientAddress ? 'none' : 'accentActive'}
        borderRadius="lg"
        name={ElementName.SelectRecipient}
        p="xs"
        px="sm"
        onPress={() => {
          navigate(Screens.RecipientSelector, {
            selectedRecipient: recipientAddress,
            setSelectedRecipient: (newRecipient: string) => setRecipientAddress(newRecipient),
          })
        }}>
        <Flex gap="xxs">
          <Flex centered row gap="sm">
            {recipientAddress ? (
              <RecipientMetadata recipient={recipientAddress} />
            ) : (
              <RecipientInput />
            )}
            <Chevron color={theme.colors.textPrimary} direction="e" />
          </Flex>
          {recipientAddress && <RecipientPrevTransfers recipient={recipientAddress} />}
        </Flex>
      </Button>
    </Flex>
  )
}

function RecipientInput() {
  const { t } = useTranslation()

  return (
    <Text color="white" variant="mediumLabel">
      {t('Select Recipient')}
    </Text>
  )
}

function RecipientMetadata({ recipient }: { recipient: string }) {
  const { loading, address, name } = useENS(ChainId.Mainnet, recipient)

  if (loading || !address) {
    return <ActivityIndicator />
  }

  return (
    <Flex centered row gap="sm">
      <Unicon address={address} size={24} />
      <FormattedAddress address={address} name={name} variant="headlineSmall" />
    </Flex>
  )
}

export function RecipientPrevTransfers({ recipient }: { recipient: string }) {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()
  const prevTxns = useNumTransactionsBetweenAddresses(activeAddress, recipient) ?? 0

  return (
    <Text color="textSecondary" textAlign="center" variant="caption">
      {t('{{ prevTxns }} previous transfers', { prevTxns })}
    </Text>
  )
}
