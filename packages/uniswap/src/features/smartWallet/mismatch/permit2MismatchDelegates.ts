import { DynamicConfigs, getDynamicConfigValue, Permit2MismatchDelegatesConfigKey } from '@universe/gating'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'

/**
 * EIP-7702 delegates whose ERC-1271 validation rejects raw Permit2 ECDSA signatures, so
 * delegated accounts need the mismatch fallback (permit as transaction, no UniswapX).
 * A mismatch with other delegates (e.g. MetaMask's) is benign — they still accept raw
 * Permit2 signatures.
 *
 * The list is fully controlled by the permit2_mismatch_delegates dynamic config (e.g.
 * Alchemy's SemiModularAccount7702 used by Robinhood Wallet); with the empty default the
 * fallback fires for nobody until the config is populated.
 */
export function isPermit2MismatchDelegate(delegatedAddress: Address): boolean {
  const permit2MismatchDelegates = getDynamicConfigValue({
    config: DynamicConfigs.Permit2MismatchDelegates,
    key: Permit2MismatchDelegatesConfigKey.DelegateAddresses,
    defaultValue: [] as string[],
  })
  return permit2MismatchDelegates.some((delegate) => areEvmAddressesEqual(delegate, delegatedAddress))
}
