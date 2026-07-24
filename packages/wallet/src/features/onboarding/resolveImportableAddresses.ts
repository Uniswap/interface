import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fetchBalancesAndUnitags } from 'wallet/src/features/onboarding/fetchBalancesAndUnitags'

// Non-hook variant of the significance filter used by `useImportableAccounts`. Lets the
// passkey import path decide whether to route through SelectWalletScreen from inside an
// event handler. ENS lookup is intentionally skipped here (10 RPC calls would block the
// flow); SelectWalletScreen still runs the full check including ENS via the hook.
export async function resolveImportableAddresses({
  addresses,
  chainIds,
  requiredAddress,
}: {
  addresses: Address[]
  chainIds: UniverseChainId[]
  // Address that must always appear in the returned set (e.g. the canonical embedded-wallet
  // address from WalletSignIn). Guarantees downstream lookups can find it even when the
  // significance filter returns an empty/different subset.
  requiredAddress?: Address
}): Promise<Address[]> {
  if (addresses.length === 0) {
    return []
  }

  const { balanceByAddress, unitagByAddress } = await fetchBalancesAndUnitags({
    addresses,
    chainIds,
  })

  const significant = addresses.filter((address) => {
    const balance = balanceByAddress[address]
    return (balance && balance > 0) || Boolean(unitagByAddress[address]?.username)
  })

  const base = significant.length > 0 ? significant : addresses[0] ? [addresses[0]] : []

  if (requiredAddress) {
    const requiredLower = requiredAddress.toLowerCase()
    if (!base.some((a) => a.toLowerCase() === requiredLower)) {
      return [requiredAddress, ...base]
    }
  }

  return base
}
