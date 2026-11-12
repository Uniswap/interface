import { AddressStringFormat, isEVMChain, normalizeAddress, type UniverseChainId } from '@universe/chains'
import { HookDetailsReferrer } from 'uniswap/src/features/poolHooks/types'
import { HOOK_DETAILS_REFERRER_QUERY_PARAM } from 'uniswap/src/utils/linking'
import { isEVMAddress, isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { HookDetailsStatus } from '~/pages/HookDetails/types'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

export type HookDetailRouteState =
  | { status: HookDetailsStatus.Valid; chainId: UniverseChainId; hookAddress: string }
  | { status: HookDetailsStatus.InvalidAddress }
  | { status: HookDetailsStatus.UnsupportedChain }

export function getHookDetailRouteState(
  { chainName, hookAddress }: { chainName?: string; hookAddress?: string },
  isSupportedChain: (chainId: UniverseChainId) => boolean,
): HookDetailRouteState {
  const chainId = getChainIdFromChainUrlParam(chainName)
  if (chainId === undefined || !isEVMChain(chainId) || !isSupportedChain(chainId)) {
    return { status: HookDetailsStatus.UnsupportedChain }
  }

  const normalizedAddress = normalizeAddress(hookAddress ?? '', AddressStringFormat.Lowercase)
  // Validate hex after lowercasing; don't enforce checksum casing on hand-edited deep links.
  if (!isEVMAddress(normalizedAddress) || !isEVMAddressWithChecksum(normalizedAddress)) {
    return { status: HookDetailsStatus.InvalidAddress }
  }

  return { status: HookDetailsStatus.Valid, chainId, hookAddress: normalizedAddress }
}

export function getHookDetailReferrer(searchParams: URLSearchParams): HookDetailsReferrer {
  const values = searchParams.getAll(HOOK_DETAILS_REFERRER_QUERY_PARAM)
  const referrer = values[0]
  return values.length === 1 && (referrer === HookDetailsReferrer.List || referrer === HookDetailsReferrer.Badge)
    ? referrer
    : HookDetailsReferrer.External
}
