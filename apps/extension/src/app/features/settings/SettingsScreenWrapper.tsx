import { Outlet } from 'react-router'
import { Flex } from 'ui/src'

/**
 * SettingsScreenWrapper is a wrapper used by all settings screens.
 */
export function SettingsScreenWrapper(): JSX.Element {
  return (
    <Flex fill backgroundColor="$surface1" pb="$spacing12" pt="$spacing8" px="$spacing12">
      <Outlet />
    </Flex>
  )
}
