import { useTranslation } from 'react-i18next'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ScanQr } from 'ui/src/components/icons'

export function SyncFromPhoneButton({
  isResetting,
  fill,
}: {
  isResetting?: boolean
  fill?: boolean
}): JSX.Element | null {
  const { t } = useTranslation()

  return (
    <TouchableArea
      px="$spacing12"
      py="$spacing8"
      onPress={(): void =>
        navigate(`/${TopLevelRoutes.Onboarding}/${isResetting ? OnboardingRoutes.ResetScan : OnboardingRoutes.Scan}`)
      }
    >
      <Flex centered row fill={fill} gap="$spacing8">
        <ScanQr color="$accent1" size="$icon.24" />
        <Text color="$accent1" variant="buttonLabel2">
          {t('onboarding.intro.mobileScan.button')}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
