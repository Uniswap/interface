import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Interface } from 'ethers/lib/utils'

export const UNISWAP_V2_PAIR_INTERFACE = new Interface(IUniswapV2Pair.abi)
