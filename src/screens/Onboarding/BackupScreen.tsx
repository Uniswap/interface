import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackScreenProps } from '@react-navigation/stack'
import React, { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import {
  AppStackParamList,
  OnboardingStackBaseParams,
  OnboardingStackParamList,
  useOnboardingStackNavigation,
} from 'src/app/navigation/types'
import Check from 'src/assets/icons/check.svg'
import CloudIcon from 'src/assets/icons/cloud.svg'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import PencilIcon from 'src/assets/icons/pencil.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { EducationContentType } from 'src/components/education'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { isICloudAvailable } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { BackupType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'

type Props = CompositeScreenProps<
  StackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>,
  NativeStackScreenProps<AppStackParamList, Screens.Education>
>

export function BackupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const activeAccountBackups = useActiveAccount()?.backups

  useEffect(() => {
    const shouldOverrideBackButton = params?.importType === ImportType.SeedPhrase
    if (shouldOverrideBackButton) {
      navigation.setOptions({
        headerLeft: () => (
          <BackButton
            onPressBack={() => {
              navigation.pop(2)
            }}
          />
        ),
      })
    }
  })

  const onPressNext = () => {
    navigation.navigate({ name: OnboardingScreens.Notifications, params, merge: true })
  }

  const onPressEducationButton = () => {
    navigation.navigate(Screens.Education, { type: EducationContentType.SeedPhrase })
  }

  const disabled = !activeAccountBackups || activeAccountBackups.length < 1
  const showSkipOption =
    !activeAccountBackups?.length &&
    (params?.importType === ImportType.SeedPhrase || params?.importType === ImportType.Restore)

  return (
    <OnboardingScreen
      subtitle={t(
        'Backups let you restore your wallet if you lose or damage your device. We recommend both backup types.'
      )}
      title={t('Back up your recovery phrase')}>
      <Flex grow>
        <BackupOptions backupMethods={activeAccountBackups} params={params} />
        <TouchableArea alignSelf="flex-start" py="none" onPress={onPressEducationButton}>
          <Flex centered row gap="xxs">
            <InfoCircle
              color={theme.colors.textSecondary}
              height={theme.iconSizes.lg}
              width={theme.iconSizes.lg}
            />
            <Text color="textPrimary" variant="subheadSmall">
              {t('What’s a recovery phrase?')}
            </Text>
          </Flex>
        </TouchableArea>
        <Flex grow justifyContent="flex-end">
          {showSkipOption ? (
            <Button
              emphasis={ButtonEmphasis.Tertiary}
              label={t('I already backed up')}
              name={ElementName.Next}
              onPress={onPressNext}
            />
          ) : (
            <Button
              disabled={disabled}
              label={disabled ? t('Add backup to continue') : t('Continue')}
              name={ElementName.Next}
              onPress={onPressNext}
            />
          )}
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function BackupOptions({
  backupMethods,
  params,
}: {
  backupMethods?: BackupType[]
  params: Readonly<OnboardingStackBaseParams>
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [iCloudAvailable, setICloudAvailable] = useState<boolean>()

  const { navigate } = useOnboardingStackNavigation()

  useEffect(() => {
    async function checkICloudAvailable() {
      const available = await isICloudAvailable()
      setICloudAvailable(available)
    }
    checkICloudAvailable()
  }, [])

  return (
    <Flex gap="xs">
      <BackupOptionButton
        caption={t('Back your phrase up to iCloud and encrypt it with a password.')}
        completed={backupMethods?.includes(BackupType.Cloud)}
        icon={
          <Flex
            centered
            borderColor="accentBranded"
            borderRadius="md"
            borderWidth={1.25}
            height={32}
            padding="md"
            width={32}>
            <CloudIcon color={theme.colors.textPrimary} height={16} strokeWidth={1.5} width={16} />
          </Flex>
        }
        label={t('iCloud backup')}
        name={ElementName.AddiCloudBackup}
        onPress={() => {
          if (!iCloudAvailable) {
            Alert.alert(
              t('iCloud Drive not available'),
              t(
                'Please verify that you are logged in to an Apple ID with iCloud Drive enabled on this device and try again.'
              ),
              [
                { text: t('Go to settings'), onPress: openSettings, style: 'default' },
                { text: t('Not now'), style: 'cancel' },
              ]
            )
            return
          }

          navigate({
            name: OnboardingScreens.BackupCloudPassword,
            params: { importType: params?.importType },
            merge: true,
          })
        }}
      />
      <BackupOptionButton
        caption={t('Write your phrase down and store it in a safe place.')}
        completed={backupMethods?.includes(BackupType.Manual)}
        icon={
          <Flex
            centered
            borderColor="accentBranded"
            borderRadius="md"
            borderWidth={1.25}
            height={32}
            padding="md"
            width={32}>
            <PencilIcon color={theme.colors.textPrimary} height={16} strokeWidth={1.5} width={16} />
          </Flex>
        }
        label={t('Manual backup')}
        name={ElementName.AddManualBackup}
        onPress={() => {
          navigate({ name: OnboardingScreens.BackupManual, params, merge: true })
        }}
      />
    </Flex>
  )
}

interface BackupOptionButtonProps {
  completed?: boolean
  icon: ReactNode
  label: string
  caption: string
  name?: ElementName
  onPress: () => void
}

function BackupOptionButton({
  icon,
  label,
  name,
  caption,
  onPress,
  completed,
}: BackupOptionButtonProps) {
  const theme = useAppTheme()
  return (
    <Box>
      <TouchableArea
        backgroundColor="background1"
        borderColor={completed ? 'background3' : 'backgroundOutline'}
        borderRadius="md"
        borderWidth={1}
        disabled={completed}
        name={name}
        px="md"
        py="sm"
        testID={name}
        onPress={onPress}>
        <Flex row alignItems="center" gap="xs" justifyContent="space-between">
          <Flex row alignItems="center" flexShrink={1} gap="sm" opacity={completed ? 0.4 : 1}>
            <Box>{icon}</Box>
            <Flex flexShrink={1} gap="xxxs">
              <Text variant="subheadSmall">{label}</Text>
              <Text color="textSecondary" variant="bodySmall">
                {caption}
              </Text>
            </Flex>
          </Flex>
          <Flex grow alignItems="flex-end">
            {completed ? (
              <Check color={theme.colors.accentSuccess} height="24" width="24" />
            ) : (
              <Chevron color={theme.colors.textSecondary} direction="e" height="24" width="24" />
            )}
          </Flex>
        </Flex>
      </TouchableArea>
    </Box>
  )
}
