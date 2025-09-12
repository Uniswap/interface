import '@tamagui/core/reset.css'
import 'src/app/Global.css'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createHashRouter, RouterProvider } from 'react-router'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { BaseAppContainer } from 'src/app/core/BaseAppContainer'
import { DatadogAppNameTag } from 'src/app/datadog'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { Button, Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { GoogleChromeLogo } from 'ui/src/components/logos/GoogleChromeLogo'
import { iconSizes, spacing } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks/useTestnetModeForLoggingAndAnalytics'

const router = createHashRouter([
  {
    path: '',
    element: <PopupContent />,
    errorElement: <ErrorElement />,
  },
])

function PopupContent(): JSX.Element {
  const { t } = useTranslation()

  useTestnetModeForLoggingAndAnalytics()

  const searchParams = new URLSearchParams(window.location.search)
  const tabId = searchParams.get('tabId')
  const windowId = searchParams.get('windowId')

  const tabIdNumber = tabId ? Number(tabId) : undefined
  const windowIdNumber = windowId ? Number(windowId) : undefined

  return (
    <Trace logImpression screen={ExtensionScreens.PopupOpenExtension}>
      <Flex fill gap="$spacing16" height="100%" px="$spacing24" py="$spacing24">
        <Flex row>
          <Flex position="relative">
            <Image height={iconSizes.icon40} source={UNISWAP_LOGO} width={iconSizes.icon40} />
            <Flex
              backgroundColor="$surface1"
              borderColor="$surface3"
              borderRadius={6}
              borderWidth="$spacing1"
              bottom={-spacing.spacing4}
              p="$spacing2"
              position="absolute"
              right={-spacing.spacing4}
            >
              <GoogleChromeLogo size={iconSizes.icon12} />
            </Flex>
          </Flex>
        </Flex>

        <Flex gap="$spacing4">
          <Text color="$neutral1" variant="subheading1">
            {t('extension.popup.chrome.title')}
          </Text>
          <Text color="$neutral2" variant="body2">
            {t('extension.popup.chrome.description')}
          </Text>
        </Flex>

        <Flex fill />

        <Trace logPress element={ElementName.ExtensionPopupOpenButton}>
          <Flex row>
            <Button
              variant="branded"
              emphasis="primary"
              size="medium"
              width="100%"
              onPress={async () => {
                if (windowIdNumber) {
                  await chrome.sidePanel.open({ tabId: tabIdNumber, windowId: windowIdNumber })
                  window.close()
                }
              }}
            >
              {t('extension.popup.chrome.button')}
            </Button>
          </Flex>
        </Trace>
      </Flex>
    </Trace>
  )
}

// TODO WALL-4313 - Backup for some broken chrome.sidePanel.open functionality
// Consider removing this once the issue is resolved or leaving as fallback
export default function PopupApp(): JSX.Element {
  // initialize analytics on load
  useEffect(() => {
    initExtensionAnalytics().catch(() => undefined)
  }, [])

  return (
    <BaseAppContainer appName={DatadogAppNameTag.Popup}>
      <RouterProvider router={router} />
    </BaseAppContainer>
  )
}
