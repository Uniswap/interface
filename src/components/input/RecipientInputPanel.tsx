import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Identicon } from 'src/components/accounts/Identicon'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { FormattedAddress } from 'src/components/text/FormattedAddress'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { ElementName } from 'src/features/telemetry/constants'
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
  const navigation = useAppStackNavigation()
  const { t } = useTranslation()
  const theme = useAppTheme()

  return (
    <Flex centered gap="sm">
      {recipientAddress && (
        <Text color="gray400" variant="bodyMd">
          {t('To')}
        </Text>
      )}
      <Button
        bg={recipientAddress ? 'tokenSelector' : 'primary1'}
        borderRadius="lg"
        name={ElementName.SelectRecipient}
        p="sm"
        onPress={() => {
          navigation.navigate(Screens.RecipientSelector, {
            selectedRecipient: recipientAddress,
            setSelectedRecipient: (newRecipient: string) => setRecipientAddress(newRecipient),
          })
        }}>
        <Flex row gap="sm">
          {recipientAddress ? (
            <RecipientMetadata recipient={recipientAddress} />
          ) : (
            <RecipientInput />
          )}
          <Chevron color={theme.colors.white} direction="e" height={8} width={12} />
        </Flex>
      </Button>
    </Flex>
  )
}

function RecipientInput() {
  const { t } = useTranslation()

  return (
    <Text color="white" variant="h3">
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
      <Identicon address={address} size={24} />
      <FormattedAddress address={address} name={name} variant="h3" />
    </Flex>
  )
}
