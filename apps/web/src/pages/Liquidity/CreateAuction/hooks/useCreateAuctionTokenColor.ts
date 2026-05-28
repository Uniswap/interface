import { useCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import type { TokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'

export function useCreateAuctionTokenColor(): TokenAccentHex | undefined {
  return useCreateAuctionStore((state) => state.tokenColor)
}
