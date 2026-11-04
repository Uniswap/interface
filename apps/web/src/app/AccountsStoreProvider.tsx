import type { PropsWithChildren } from 'react'
import { WebAccountsStoreProvider } from '~/connection/accounts/provider'
import { useOneClickSwapSetting } from '~/state/oneClickSwap/hooks'

/** Mounts the web accounts store with the app settings it depends on. */
export function AccountsStoreProvider({ children }: PropsWithChildren) {
  const { enabled: includeAtomicCapability } = useOneClickSwapSetting()
  return (
    <WebAccountsStoreProvider includeAtomicCapability={includeAtomicCapability}>{children}</WebAccountsStoreProvider>
  )
}
