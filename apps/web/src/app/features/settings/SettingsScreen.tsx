import { Outlet } from 'react-router-dom'
import { Flex } from 'ui/src/components/layout/Flex'

/**
 * SettingsScreen is a wrapper used by all settings screens.
 */
export function SettingsScreen(): JSX.Element {
  return (
    <Flex alignItems="center" flexGrow={1} width="100%">
      <Flex
        backgroundColor="$background1"
        flexGrow={1}
        gap="$spacing8"
        paddingBottom="$spacing24"
        paddingTop="$spacing8"
        width="100%">
        <Outlet />
      </Flex>
    </Flex>
  )
}
