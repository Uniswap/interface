import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackScreenProps } from '@react-navigation/stack'
import { useResponsiveProp } from '@shopify/restyle'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { SvgProps } from 'react-native-svg'
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
import { Box, BoxProps, Flex } from 'src/components/layout'
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

const spacerProps: BoxProps = {
  borderBottomColor: 'backgroundOutline',
  borderBottomWidth: 0.5,
}

export function BackupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const activeAccountBackups = useActiveAccount()?.backups

  const renderHeaderLeft = useCallback(
    () => (
      <BackButton
        onPressBack={(): void => {
          navigation.pop(2)
        }}
      />
    ),
    [navigation]
  )

  useEffect(() => {
    const shouldOverrideBackButton = params?.importType === ImportType.SeedPhrase
    if (shouldOverrideBackButton) {
      navigation.setOptions({
        headerLeft: renderHeaderLeft,
      })
    }
  })

  const onPressNext = (): void => {
    navigation.navigate({ name: OnboardingScreens.Notifications, params, merge: true })
  }

  const onPressEducationButton = (): void => {
    navigation.navigate(Screens.Education, { type: EducationContentType.SeedPhrase })
  }

  const disabled = !activeAccountBackups || activeAccountBackups.length < 1
  const showSkipOption =
    !activeAccountBackups?.length &&
    (params?.importType === ImportType.SeedPhrase || params?.importType === ImportType.Restore)

  return (
    <OnboardingScreen
      subtitle={t(
        'Your recovery phrase is the key to your wallet. Back it up so you can restore your wallet if you lose or damage your device.'
      )}
      title={t('Back up your recovery phrase')}>
      <Flex grow>
        <BackupOptions backupMethods={activeAccountBackups} params={params} />
        <TouchableArea alignSelf="flex-start" py="none" onPress={onPressEducationButton}>
          <Flex centered row gap="xxs">
            <Box px="xxs">
              <InfoCircle
                color={theme.colors.textSecondary}
                height={theme.iconSizes.lg}
                width={theme.iconSizes.lg}
              />
            </Box>
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
}): ReactElement {
  const { t } = useTranslation()
  const [iCloudAvailable, setICloudAvailable] = useState<boolean>()

  const { navigate } = useOnboardingStackNavigation()

  useEffect(() => {
    async function checkICloudAvailable(): Promise<void> {
      const available = await isICloudAvailable()
      setICloudAvailable(available)
    }
    checkICloudAvailable()
  }, [])

  return (
    <Flex gap="none" spacerProps={spacerProps}>
      <BackupOptionButton
        Icon={CloudIcon}
        completed={backupMethods?.includes(BackupType.Cloud)}
        label={t('iCloud backup')}
        name={ElementName.AddiCloudBackup}
        onPress={(): void => {
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
            params,
            merge: true,
          })
        }}
      />
      <BackupOptionButton
        Icon={PencilIcon}
        completed={backupMethods?.includes(BackupType.Manual)}
        label={t('Manual backup')}
        name={ElementName.AddManualBackup}
        onPress={(): void => {
          navigate({ name: OnboardingScreens.BackupManual, params, merge: true })
        }}
      />
    </Flex>
  )
}

interface BackupOptionButtonProps {
  completed?: boolean
  Icon: React.FC<SvgProps>
  label: string
  name: ElementName
  onPress: () => void
}

function BackupOptionButton({
  Icon,
  label,
  name,
  onPress,
  completed,
}: BackupOptionButtonProps): ReactElement {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const labelMaxFontSizeMultiplier = useResponsiveProp({
    xs: 1.2,
    sm: theme.textVariants.subheadSmall.maxFontSizeMultiplier,
  })

  return (
    <Flex row alignItems="center" py="md">
      <Flex
        centered
        borderColor="accentBranded"
        borderRadius="md"
        borderWidth={1.25}
        height={32}
        padding="md"
        width={32}>
        <Icon color={theme.colors.textPrimary} height={16} strokeWidth={1.5} width={16} />
      </Flex>
      <Text maxFontSizeMultiplier={labelMaxFontSizeMultiplier} variant="subheadSmall">
        {label}
      </Text>
      <Flex grow alignItems="flex-end">
        {completed ? (
          <Flex row alignItems="center" gap="xxs">
            <Check
              color={theme.colors.accentSuccess}
              height={theme.iconSizes.md}
              width={theme.iconSizes.md}
            />
            <Text fontWeight="600" variant="bodyMicro">
              {t('Completed')}
            </Text>
          </Flex>
        ) : (
          <TouchableArea
            hapticFeedback
            backgroundColor="magentaDark"
            borderRadius="full"
            p="sm"
            testID={name}
            onPress={onPress}>
            <Flex row>
              <Text color="magentaVibrant" variant="buttonLabelMicro">
                + {t('ADD')}
              </Text>
            </Flex>
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
