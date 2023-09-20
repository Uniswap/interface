import { Outlet } from 'react-router-dom'
import { Flex } from 'ui/src'

/**
 * SettingsScreenWrapper is a wrapper used by all settings screens.
 */
export function SettingsScreenWrapper(): JSX.Element {
  return (
    <Flex fill backgroundColor="$surface1" p="$spacing16">
      <Outlet />
    </Flex>
  )
}
