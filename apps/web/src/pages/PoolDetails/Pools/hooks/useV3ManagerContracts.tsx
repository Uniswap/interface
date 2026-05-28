import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES as V3NFT_ADDRESSES } from '@uniswap/sdk-core'
import NFTPositionManagerJSON from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import { NonfungiblePositionManager } from 'uniswap/src/abis/types/v3'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ContractMap, useContractMultichain } from '~/pages/PoolDetails/Pools/hooks/useContractMultichain'

export function useV3ManagerContracts(chainIds: UniverseChainId[]): ContractMap<NonfungiblePositionManager> {
  return useContractMultichain<NonfungiblePositionManager>({
    addressMap: V3NFT_ADDRESSES,
    ABI: NFTPositionManagerJSON.abi,
    chainIds,
  })
}
