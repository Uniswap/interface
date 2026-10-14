import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { areAddressesEqual, Platform } from '@universe/chains'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { usePositionOwnerV2 } from '~/hooks/usePositionOwnerV2'

/**
 * Sends anyone who is not the position's owner back to /positions. V3 ownership is the `owner` the
 * position read already returned; V2 ownership is a separate onchain pair-token balance, so the redirect
 * waits for that read to settle instead of treating a still-pending read as "not the owner". Landing here
 * cold (the positions-list menu, a direct URL) must not bounce the real owner.
 */
export function useRedirectIfNotPositionOwner({
  positionInfo,
  pairAddress,
}: {
  positionInfo: PositionInfo
  pairAddress?: string
}): void {
  const navigate = useNavigate()
  const account = useWallet().evmAccount

  const isOwnerV2 = usePositionOwnerV2({
    account: account?.address,
    address: pairAddress,
    chainId: positionInfo.chainId,
  })
  const isOwnerV3 = areAddressesEqual({
    addressInput1: { address: account?.address, platform: Platform.EVM },
    addressInput2: { address: positionInfo.owner, platform: Platform.EVM },
  })

  const isNotOwner =
    (positionInfo.version === ProtocolVersion.V2 && isOwnerV2 === false) ||
    (positionInfo.version === ProtocolVersion.V3 && !isOwnerV3)

  useEffect(() => {
    if (isNotOwner) {
      navigate('/positions')
    }
  }, [isNotOwner, navigate])
}
