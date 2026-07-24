import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useWalletNfts } from 'uniswap/src/features/nfts/hooks/useWalletNfts'
import { NFTItem } from 'uniswap/src/features/nfts/types'

export function useNFT({
  owner = '',
  address,
  tokenId,
}: {
  owner?: Address
  address?: Address
  tokenId?: string
}): NFTItem | undefined {
  const { nfts } = useWalletNfts({
    address: owner,
    filterSpam: false,
    pollInterval: PollingInterval.Slow,
    skip: !owner || !address || !tokenId,
  })

  return useMemo(
    () => nfts.find((n) => n.contractAddress === address && n.tokenId === tokenId),
    [address, tokenId, nfts],
  )
}
