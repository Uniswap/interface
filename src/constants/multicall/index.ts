import { ChainId } from 'quickswap-sdk'
import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.MATIC]: '0x95028E5B8a734bb7E2071F96De89BABe75be9C8E',
  [ChainId.MUMBAI]: '0x95028E5B8a734bb7E2071F96De89BABe75be9C8E'
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
