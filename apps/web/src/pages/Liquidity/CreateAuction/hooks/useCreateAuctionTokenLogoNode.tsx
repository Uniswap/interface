import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { CreateAuctionTokenLogo } from '~/pages/Liquidity/CreateAuction/components/CreateAuctionTokenLogo'

interface UseCreateAuctionTokenLogoNodeOptions {
  hideNetworkLogo?: boolean
}

/** Token logo for the current create-auction token form (new or existing). */
export function useCreateAuctionTokenLogoNode(
  size: number,
  options: UseCreateAuctionTokenLogoNodeOptions = {},
): ReactNode {
  const { hideNetworkLogo } = options

  return useMemo(
    () => <CreateAuctionTokenLogo size={size} hideNetworkLogo={hideNetworkLogo} />,
    [hideNetworkLogo, size],
  )
}
