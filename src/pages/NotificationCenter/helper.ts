import { ChainId, Currency } from '@kyberswap/ks-sdk-core'

import { ETHER_ADDRESS, ETHER_ADDRESS_SOLANA } from 'constants/index'
import { isEVM } from 'constants/networks'

export const getTokenAddress = (currency: Currency, chainId: ChainId) =>
  currency.isNative ? (isEVM(chainId) ? ETHER_ADDRESS : ETHER_ADDRESS_SOLANA) : currency?.wrapped.address ?? ''
