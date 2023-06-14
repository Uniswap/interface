import { Outlet } from 'react-router-dom'
import { Flex } from 'ui/components/layout/Flex'

/**
 * SettingsScreenWrapper is a wrapper used by all settings screens.
 */
export function SettingsScreenWrapper(): JSX.Element {
  return (
    <Flex backgroundColor="$background0" flex={1} padding="$spacing12">
      <Outlet />
    </Flex>
  )
}
