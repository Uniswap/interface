import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SettingsItem } from 'src/app/features/settings/components/SettingsItem'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Accordion, Flex, ScrollView, Text } from 'ui/src'
import { Clock, Wrench } from 'ui/src/components/icons'
import { CacheConfig } from 'uniswap/src/components/gating/CacheConfig'
import { GatingOverrides } from 'uniswap/src/components/gating/GatingOverrides'

/**
 * When modifying this component, take into consideration that this is used
 * both as a full screen page in the Sidebar, and as a modal in the Onboarding page.
 */
export function DevMenuScreen(): JSX.Element {
  const { navigateTo } = useExtensionNavigation()

  return (
    <ScrollView>
      <ScreenHeader title="Developer Settings" />

      <Flex gap="$spacing8">
        <Text variant="heading3" mt="$padding12">
          Debug Screens
        </Text>
        <SettingsItem
          Icon={Wrench}
          title="Sessions Debug"
          onPress={(): void => navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.SessionsDebug}`)}
        />
        <SettingsItem
          Icon={Clock}
          title="Hashcash Benchmark"
          onPress={(): void => navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.HashcashBenchmark}`)}
        />

        <Text variant="heading3" mt="$padding12">
          Gating
        </Text>
        <Accordion collapsible type="single">
          <GatingOverrides />
        </Accordion>

        <Text variant="heading3" mt="$padding12">
          Miscellaneous
        </Text>
        <Accordion collapsible type="single">
          <CacheConfig />
        </Accordion>
      </Flex>
    </ScrollView>
  )
}
