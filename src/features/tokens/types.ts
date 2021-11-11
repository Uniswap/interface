import { Token } from '@uniswap/sdk-core'
import { ChainIdTo } from 'src/constants/chains'

export type ChainIdToAddressToToken = ChainIdTo<Record<Address, Token>>
