import React from 'react'
import { Alert } from 'react-native'
import { Accordion, Flex, Text } from 'ui/src'
import { GatingButton } from 'uniswap/src/components/gating/GatingButton'
import { AccordionHeader } from 'uniswap/src/components/gating/GatingOverrides'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function MissileaneousDevSection(): JSX.Element {
  return (
    <>
      <Text variant="heading3">Misc.</Text>
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
    </>
  )
}

const onDeleteSeedPhrase = (): void => {
  alertHelper(
    'Delete Seed Phrases',
    'Are you sure you want to delete all seed phrases? This action cannot be undone.',
    async () => {
      const mnemonicIds = await Keyring.getMnemonicIds()
      for (const mnemonicId of mnemonicIds) {
        await Keyring.removeMnemonic(mnemonicId)
      }
    },
  )
}

const onDeletePrivateKeys = (): void => {
  alertHelper(
    'Delete Private Keys',
    'Are you sure you want to delete all private keys? This action cannot be undone.',
    async () => {
      const addresses = await Keyring.getAddressesForStoredPrivateKeys()
      for (const address of addresses) {
        await Keyring.removePrivateKey(address)
      }
    },
  )
}

const alertHelper = (title: string, message: string, onPress: () => Promise<void>): void => {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress },
  ])
}
