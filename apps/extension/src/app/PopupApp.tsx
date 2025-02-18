import '@tamagui/core/reset.css'
import 'src/app/Global.css'

import { useEffect } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { ExtensionStatsigProvider } from 'src/app/StatsigProvider'
import { GraphqlProvider } from 'src/app/apollo'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { TraceUserProperties } from 'src/app/components/Trace/TraceUserProperties'
import { DatadogAppNameTag } from 'src/app/datadog'
import { DappContextProvider } from 'src/app/features/dapp/DappContext'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { getReduxPersistor, getReduxStore } from 'src/store/store'
import { DeprecatedButton, Flex, Image, Text } from 'ui/src'
import { CHROME_LOGO, UNISWAP_LOGO } from 'ui/src/assets'
import { iconSizes, spacing } from 'ui/src/theme'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import { syncAppWithDeviceLanguage } from 'uniswap/src/features/settings/slice'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import i18n from 'uniswap/src/i18n'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'

const router = createHashRouter([
  {
    path: '',
    element: <PopupContent />,
    errorElement: <ErrorElement />,
  },
])

function PopupContent(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(syncAppWithDeviceLanguage())
  }, [dispatch])
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
              <Image height={iconSizes.icon12} source={CHROME_LOGO} width={iconSizes.icon12} />
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
          <DeprecatedButton
            theme="primary"
            width="100%"
            onPress={async () => {
              if (windowIdNumber) {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                await chrome.sidePanel.open({ tabId: tabIdNumber, windowId: windowIdNumber })
                window.close()
              }
            }}
          >
            {t('extension.popup.chrome.button')}
          </DeprecatedButton>
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
    <Trace>
      <PersistGate persistor={getReduxPersistor()}>
        <ExtensionStatsigProvider appName={DatadogAppNameTag.Popup}>
          <I18nextProvider i18n={i18n}>
            <SharedWalletProvider reduxStore={getReduxStore()}>
              <ErrorBoundary>
                <GraphqlProvider>
                  <BlankUrlProvider>
                    <LocalizationContextProvider>
                      <UnitagUpdaterContextProvider>
                        <TraceUserProperties />
                        <DappContextProvider>
                          <RouterProvider router={router} />
                        </DappContextProvider>
                      </UnitagUpdaterContextProvider>
                    </LocalizationContextProvider>
                  </BlankUrlProvider>
                </GraphqlProvider>
              </ErrorBoundary>
            </SharedWalletProvider>
          </I18nextProvider>
        </ExtensionStatsigProvider>
      </PersistGate>
    </Trace>
  )
}
