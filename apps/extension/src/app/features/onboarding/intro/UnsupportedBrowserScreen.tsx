import { useTranslation } from 'react-i18next'
import { MainIntroWrapper } from 'src/app/features/onboarding/intro/MainIntroWrapper'
import { isAndroid } from 'src/app/utils/chrome'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'

export function UnsupportedBrowserScreen(): JSX.Element {
  const { t } = useTranslation()

  const title = isAndroid()
    ? t('onboarding.extension.unsupported.android.title')
    : t('onboarding.extension.unsupported.title')

  const description = isAndroid()
    ? t('onboarding.extension.unsupported.android.description')
    : t('onboarding.extension.unsupported.description')

  return (
    <Trace logImpression screen={ExtensionScreens.UnsupportedBrowserScreen}>
      <Flex centered grow gap="$spacing16" justifyContent="center">
        <MainIntroWrapper>
          <Flex fill justifyContent="flex-end">
            <Flex
              row
              alignItems="flex-start"
              backgroundColor="$surface2"
              borderRadius="$rounded16"
              gap="$spacing12"
              p="$spacing12"
            >
              <Flex backgroundColor="$surface3" borderRadius="$rounded12" p={10}>
                <AlertTriangleFilled size="$icon.20" />
              </Flex>
              <Flex fill gap="$spacing2">
                <Text color="$neutral1" variant="body3">
                  {title}
                </Text>
                <Text color="$neutral2" variant="body3">
                  {description}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </MainIntroWrapper>
      </Flex>
    </Trace>
  )
}
