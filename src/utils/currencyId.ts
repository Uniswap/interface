import { Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { nativeOnChain } from 'constants/tokens'

export function currencyId(currency?: Currency, chainId?: ChainId): string {
  if (currency?.isNative && !!chainId) return nativeOnChain(chainId).symbol as string
  if (currency instanceof Token) return currency.address
  return ''
}

export function currencyIdFromAddress(address: string, chainId?: ChainId): string {
  if (
    (chainId === ChainId.MAINNET || chainId === ChainId.ROPSTEN || chainId === ChainId.OPTIMISM) &&
    WETH[chainId].address.toLowerCase() === address.toLowerCase()
  ) {
    return 'ETH'
  }

  if (
    (chainId === ChainId.MATIC || chainId === ChainId.MUMBAI) &&
    WETH[chainId].address.toLowerCase() === address.toLowerCase()
  ) {
    return 'MATIC'
  }

  if (
    (chainId === ChainId.BSCMAINNET || chainId === ChainId.BSCTESTNET) &&
    WETH[chainId].address.toLowerCase() === address.toLowerCase()
  ) {
    return 'BNB'
  }

  if (
    (chainId === ChainId.AVAXMAINNET || chainId === ChainId.AVAXTESTNET) &&
    WETH[chainId].address.toLowerCase() === address.toLowerCase()
  ) {
    return 'AVAX'
  }

  if (chainId === ChainId.FANTOM && WETH[chainId].address.toLowerCase() === address.toLowerCase()) {
    return 'FTM'
  }

  if (
    (chainId === ChainId.CRONOSTESTNET || chainId === ChainId.CRONOS) &&
    WETH[chainId].address.toLowerCase() === address.toLowerCase()
  ) {
    return 'CRO'
  }

  if (chainId === ChainId.AURORA && WETH[chainId].address.toLowerCase() === address.toLowerCase()) {
    return 'ETH'
  }
  if (chainId === ChainId.BTTC && WETH[chainId].address.toLowerCase() === address.toLowerCase()) {
    return 'BTT'
  }

  if (chainId === ChainId.VELAS && WETH[chainId].address.toLowerCase() === address.toLowerCase()) {
    return 'VLX'
  }

  if (chainId === ChainId.OASIS && WETH[chainId].address.toLowerCase() === address.toLowerCase()) {
    return 'ROSE'
  }

  return address
}
