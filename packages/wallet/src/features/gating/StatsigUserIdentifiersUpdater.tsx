import { useQuery } from '@tanstack/react-query'
import { provideUniswapIdentifierService } from '@universe/api'
import { uniswapIdentifierQuery } from '@universe/sessions'
import { useSyncStatsigUserIdentifiers } from 'uniswap/src/features/gating/useSyncStatsigUserIdentifiers'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

/**
 * Component that updates Statsig user with the active wallet address and uniswap identifier.
 * This enables experiment targeting based on these identifiers.
 *
 * Should be rendered inside a component tree that has access to:
 * - React Query client
 * - Wallet redux store (for active account address)
 * - Statsig provider
 */
export function StatsigUserIdentifiersUpdater(): null {
  const activeAddress = useActiveAccountAddress()
  const { data: uniswapIdentifier } = useQuery(uniswapIdentifierQuery(provideUniswapIdentifierService))

  useSyncStatsigUserIdentifiers({
    address: activeAddress,
    uniswapIdentifier,
  })

  return null
}
