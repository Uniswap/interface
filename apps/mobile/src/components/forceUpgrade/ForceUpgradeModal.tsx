import React from 'react'
import { useTranslation } from 'react-i18next'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ForceUpgrade } from 'wallet/src/features/forceUpgrade/ForceUpgrade'

const BACK_BUTTON_SIZE = 24

function SeedPhraseModalContent({ mnemonicId, onDismiss }: { mnemonicId: string; onDismiss: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex fill gap="$spacing16" px="$spacing12" py="$spacing24">
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={onDismiss}>
          <BackButtonView size={BACK_BUTTON_SIZE} />
        </TouchableArea>
        <Text variant="subheading1">{t('forceUpgrade.label.recoveryPhrase')}</Text>
        <Flex width={BACK_BUTTON_SIZE} />
      </Flex>
      <SeedPhraseDisplay mnemonicId={mnemonicId} onDismiss={onDismiss} />
    </Flex>
  )
}

export function ForceUpgradeModal(): JSX.Element {
  return <ForceUpgrade SeedPhraseModalContent={SeedPhraseModalContent} />
}
