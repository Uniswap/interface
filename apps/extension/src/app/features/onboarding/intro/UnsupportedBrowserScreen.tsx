import { useTranslation } from 'react-i18next'
import { MainIntroWrapper } from 'src/app/features/onboarding/intro/MainIntroWrapper'
import { Flex, Text } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'

export function UnsupportedBrowserScreen(): JSX.Element {
  const { t } = useTranslation()

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
                <AlertTriangle size="$icon.20" />
              </Flex>
              <Flex fill gap="$spacing2">
                <Text color="$neutral1" variant="body3">
                  {t('onboarding.extension.unsupported.title')}
                </Text>
                <Text color="$neutral2" variant="body3">
                  {t('onboarding.extension.unsupported.description')}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </MainIntroWrapper>
      </Flex>
    </Trace>
  )
}
