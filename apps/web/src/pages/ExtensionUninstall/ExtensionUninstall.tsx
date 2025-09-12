import MobileAppLogo from 'assets/svg/uniswap_app_logo.svg'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Image, Text, TouchableArea } from 'ui/src'
import { InterfaceEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionUninstallFeedbackOptions } from 'uniswap/src/features/telemetry/types'

const LOGO_SIZE = 60
const MAX_WIDTH = 500

export default function ExtensionUninstall() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const uninstallReasons: { text: string; analyticsValue: ExtensionUninstallFeedbackOptions }[] = [
    {
      text: t('extension.uninstall.reason.switchingWallet'),
      analyticsValue: ExtensionUninstallFeedbackOptions.SwitchingWallet,
    },
    {
      text: t('extension.uninstall.reason.missingFeatures'),
      analyticsValue: ExtensionUninstallFeedbackOptions.MissingFeatures,
    },
    {
      text: t('extension.uninstall.reason.notUsingCrypto'),
      analyticsValue: ExtensionUninstallFeedbackOptions.NotUsingCrypto,
    },
    {
      text: t('extension.uninstall.reason.other'),
      analyticsValue: ExtensionUninstallFeedbackOptions.Other,
    },
  ]

  return (
    <Trace logImpression page={InterfacePageName.ExtensionUninstall}>
      <Flex centered pt="$spacing60">
        <Flex
          centered
          gap="$spacing40"
          p="$spacing48"
          pt="$spacing60"
          maxWidth={MAX_WIDTH}
          borderRadius="$rounded32"
          borderColor="$surface3"
          borderWidth={1}
          shadowColor="$shadowColor"
          shadowOpacity={0.6}
          shadowRadius={20}
        >
          <Flex centered gap="$spacing24">
            <Image src={MobileAppLogo} width={LOGO_SIZE} height={LOGO_SIZE} />
            <Text variant="heading3">{t('extension.uninstall.title')}</Text>
            <Text alignContent="center" textAlign="center" variant="subheading2" color="$neutral2">
              {t('extension.uninstall.subtitle')}
            </Text>
          </Flex>
          <Flex gap="$spacing16" width="100%">
            {uninstallReasons.map((reason) => (
              <TouchableArea
                py="$spacing16"
                px="$spacing12"
                borderRadius="$rounded12"
                backgroundColor="$surface2"
                hoverStyle={{ backgroundColor: '$surface3' }}
                width="100%"
                alignItems="center"
                justifyContent="center"
                key={reason.analyticsValue}
                onPress={() => {
                  sendAnalyticsEvent(InterfaceEventName.ExtensionUninstallFeedback, {
                    reason: reason.analyticsValue,
                  })
                  navigate('/')
                }}
              >
                <Text variant="body2" textAlign="center">
                  {reason.text}
                </Text>
              </TouchableArea>
            ))}
          </Flex>
        </Flex>
      </Flex>
    </Trace>
  )
}
