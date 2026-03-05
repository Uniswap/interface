import { MULTICALL_ADDRESSES } from '@uniswap/sdk-core'
import MulticallJSON from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { UniswapInterfaceMulticall } from 'uniswap/src/abis/types/v3'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ContractMap, useContractMultichain } from '~/pages/PoolDetails/Pools/hooks/useContractMultichain'

export function useInterfaceMulticallContracts(chainIds: UniverseChainId[]): ContractMap<UniswapInterfaceMulticall> {
  return useContractMultichain<UniswapInterfaceMulticall>({
    addressMap: MULTICALL_ADDRESSES,
    ABI: MulticallJSON.abi,
    chainIds,
  })
}
