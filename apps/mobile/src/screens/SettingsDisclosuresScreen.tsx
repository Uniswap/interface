import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Flex, Text } from 'ui/src'
import { DisclosuresBody } from 'uniswap/src/components/disclosures/DisclosuresBody'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export function SettingsDisclosuresScreen(): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()

  return (
    <Trace logImpression screen={MobileScreens.SettingsDisclosures}>
      <Screen>
        <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
          <Text variant="body1">{t('common.disclosures')}</Text>
        </BackHeader>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
          <Flex px="$spacing16" py="$spacing16">
            <DisclosuresBody variant="body2" />
          </Flex>
        </ScrollView>
      </Screen>
    </Trace>
  )
}
