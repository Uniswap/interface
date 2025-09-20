import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useCallback } from 'react'

export function TestnetModeToggle() {
  const handleToggle = useCallback(() => {
    // Toggle does nothing - always stays on
  }, [])

  return <SettingsToggle title="Testnet mode" isActive={true} toggle={handleToggle} />
}

