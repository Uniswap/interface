import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { Flex, ScrollView } from 'ui/src'
import { DisclosuresBody } from 'uniswap/src/components/disclosures/DisclosuresBody'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'

export function SettingsDisclosuresScreen(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Trace logImpression screen={ExtensionScreens.SettingsDisclosures}>
      <Flex fill gap="$spacing8">
        <ScreenHeader title={t('common.disclosures')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Flex px="$spacing12" pb="$spacing24">
            <DisclosuresBody variant="body3" />
          </Flex>
        </ScrollView>
      </Flex>
    </Trace>
  )
}
