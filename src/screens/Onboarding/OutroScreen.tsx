import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'react-native-qrcode-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.NameAndColor>

export function OutroScreen({}: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const activeAddress = useActiveAccount()?.address

  const onPressNext = () => {
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
  }

  return (
    <Screen>
      <Flex grow justifyContent="space-between" px="md" py="lg">
        <Flex centered grow gap="xl" mb="sm">
          <Box borderColor="deprecated_primary1" borderRadius="lg" borderWidth={2} padding="lg">
            <QRCode
              backgroundColor={theme.colors.deprecated_background1}
              color={theme.colors.deprecated_primary1}
              size={190}
              value={activeAddress ?? ''}
            />
          </Box>
          <Flex centered gap="sm">
            <Text variant="h3">{t("You're ready to go!")}</Text>
            <Text color="deprecated_gray600" textAlign="center" variant="body">
              {t(
                'Transfer tokens to your wallet to make a swap or add assets to your watchlist to save them for later.'
              )}
            </Text>
          </Flex>
        </Flex>
        <PrimaryButton
          label={t('Next')}
          name={ElementName.Next}
          testID={ElementName.Next}
          onPress={onPressNext}
        />
      </Flex>
    </Screen>
  )
}
