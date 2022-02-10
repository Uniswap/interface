import { Currency, NativeCurrency, Token } from '@uniswap/sdk-core'
import { ChainIdToCurrencyIdTo } from 'src/constants/chains'

export type ChainIdToCurrencyIdToCurrency = ChainIdToCurrencyIdTo<Currency>
export type ChainIdToCurrencyIdToToken = ChainIdToCurrencyIdTo<Token>
export type ChainIdToCurrencyIdToNativeCurrency = ChainIdToCurrencyIdTo<NativeCurrency>
