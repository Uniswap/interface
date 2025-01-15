import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SeedPhraseDisplay } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SeedPhraseDisplay'
import { Flex, Text } from 'ui/src'
import { GraduationCap } from 'ui/src/components/icons/GraduationCap'
import { ForceUpgrade } from 'wallet/src/features/forceUpgrade/ForceUpgrade'

function SeedPhraseModalContent({ mnemonicId, onDismiss }: { mnemonicId: string; onDismiss: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex fill gap="$spacing24" py="$spacing8">
      <ScreenHeader title={t('forceUpgrade.label.recoveryPhrase')} onBackClick={onDismiss} />
      <Flex gap="$spacing16">
        <SeedPhraseDisplay mnemonicId={mnemonicId} />
        <Flex
          row
          alignItems="center"
          backgroundColor="$surface2"
          borderRadius="$rounded16"
          gap="$spacing8"
          p="$spacing12"
        >
          <Flex>
            <GraduationCap color="$neutral2" size="$icon.20" />
          </Flex>
          <Flex shrink>
            <Text color="$neutral2" variant="body4">
              {t('onboarding.backup.manual.banner')}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function ForceUpgradeModal(): JSX.Element {
  return <ForceUpgrade SeedPhraseModalContent={SeedPhraseModalContent} />
}
