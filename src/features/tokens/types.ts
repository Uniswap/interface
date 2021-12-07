import { Currency, Token } from '@uniswap/sdk-core'
import { ChainIdTo } from 'src/constants/chains'

export type ChainIdToAddressToCurrency = ChainIdTo<Record<Address, Currency>>
export type ChainIdToAddressToToken = ChainIdTo<Record<Address, Token>>
