import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import EyeIcon from 'src/assets/icons/eyeball.svg'
import KeyIcon from 'src/assets/icons/key-icon.svg'
import SeedPhraseIcon from 'src/assets/icons/seed-phrase-icon.svg'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Disclaimer from 'src/features/import/Disclaimer'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { opacify } from 'src/utils/colors'

const backupOption = {
  title: (t: TFunction) => t('Restore from iCloud'),
  blurb: (t: TFunction) => t('Recover a backed-up recovery phrase'),
  icon: <CloudIcon />,
  nav: OnboardingScreens.RestoreWallet,
}

const options: {
  title: (t: TFunction) => string
  blurb: (t: TFunction) => string
  icon: React.ReactNode
  nav: any
}[] = [
  {
    title: (t: TFunction) => t('Import a seed phrase'),
    blurb: (t: TFunction) => t('Enter or scan words'),
    icon: <SeedPhraseIcon />,
    nav: OnboardingScreens.SeedPhraseInput,
  },
  {
    title: (t: TFunction) => t('Import a private key'),
    blurb: (t: TFunction) => t('Enter, paste, or scan your key'),
    icon: <KeyIcon />,
    nav: OnboardingScreens.PrivateKeyInput,
  },
  {
    title: (t: TFunction) => t('Watch a wallet address'),
    blurb: (t: TFunction) => t('Enter an Ethereum address or ENS name'),
    icon: <EyeIcon />,
    nav: OnboardingScreens.WatchWallet,
  },
]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreen({ navigation }: Props) {
  const { t } = useTranslation()

  /**
   * @TODO include check icloud backups and conditionally render restore option
   */
  const backupFound = true

  return (
    <OnboardingScreen title={t('Choose how to connect your wallet')}>
      <Flex grow gap="md">
        {[...(backupFound ? [backupOption] : []), ...options].map(({ title, blurb, icon, nav }) => (
          <OptionCard
            key={'connection-option-' + title}
            blurb={blurb(t)}
            icon={icon}
            title={title(t)}
            onPress={() => navigation.navigate(nav)}
          />
        ))}
        <Flex grow justifyContent="flex-end">
          <Disclaimer />
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function OptionCard({
  title,
  blurb,
  icon,
  onPress,
}: {
  title: string
  blurb: string
  icon: React.ReactNode
  onPress: () => void
}) {
  const theme = useAppTheme()
  return (
    <Button
      backgroundColor="mainBackground"
      borderRadius="lg"
      borderWidth={1}
      p="md"
      style={{ borderColor: opacify(40, theme.colors.neutralOutline) }}
      onPress={onPress}>
      <Flex row alignItems="center" gap="md" justifyContent="space-between">
        <Flex gap="xs">
          <Flex row alignItems="center" gap="sm">
            {icon}
            <Text variant="mediumLabel">{title}</Text>
          </Flex>
          <Text color="accentText2" variant="caption">
            {blurb}
          </Text>
        </Flex>
        <Chevron color={theme.colors.neutralOutline} direction="e" height={12} width={12} />
      </Flex>
    </Button>
  )
}
