import React from 'react'
import { Alert } from 'react-native'
import { Accordion, Flex } from 'ui/src'
import { GatingButton } from 'uniswap/src/components/gating/GatingButton'
import { AccordionHeader } from 'uniswap/src/components/gating/GatingOverrides'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function SeedPhraseAndPrivateKeysDevSection(): JSX.Element {
  return (
    <Flex flexDirection="column">
      <Accordion.Item value="other-configs">
        <AccordionHeader title="🤯 Seed Phrase & Private Keys" testId={TestID.DevSeedPhrasePrivateKeysAccordion} />
        <Accordion.Content testID={TestID.DevDeleteSeedPhraseButton} gap="$spacing12">
          <GatingButton onPress={onDeleteSeedPhrase}>Delete Seed Phrase (Irreversible)</GatingButton>
        </Accordion.Content>
        <Accordion.Content testID={TestID.DevDeletePrivateKeysButton} gap="$spacing12">
          <GatingButton onPress={onDeletePrivateKeys}>Delete Private Keys (Irreversible)</GatingButton>
        </Accordion.Content>
      </Accordion.Item>
    </Flex>
  )
}

function onDeleteSeedPhrase(): void {
  alertHelper({
    title: 'Delete Seed Phrases',
    message: 'Are you sure you want to delete all seed phrases? This action cannot be undone.',
    onPress: async () => {
      const mnemonicIds = await Keyring.getMnemonicIds()
      for (const mnemonicId of mnemonicIds) {
        await Keyring.removeMnemonic(mnemonicId)
      }
    },
  })
}

function onDeletePrivateKeys(): void {
  alertHelper({
    title: 'Delete Private Keys',
    message: 'Are you sure you want to delete all private keys? This action cannot be undone.',
    onPress: async () => {
      const addresses = await Keyring.getAddressesForStoredPrivateKeys()
      for (const address of addresses) {
        await Keyring.removePrivateKey(address)
      }
    },
  })
}

function alertHelper({
  title,
  message,
  onPress,
}: {
  title: string
  message: string
  onPress: () => Promise<void>
}): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress },
  ])
}
