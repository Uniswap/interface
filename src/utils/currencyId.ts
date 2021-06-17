import { useActiveWeb3React } from 'hooks'
import { ChainId, Currency, ETHER, Token } from 'libs/sdk/src'
import { convertToNativeTokenFromETH } from './dmm'

export function currencyId(currency: Currency, chainId?: ChainId): string {
  if (currency === ETHER && !!chainId) return convertToNativeTokenFromETH(currency, chainId).symbol as string
  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}
