import { ChainId } from './chains'
import { Token } from '../sdk-core/entities/token'
import { NativeCurrency } from '../sdk-core/entities/nativeCurrency'
import invariant from 'tiny-invariant'
import { WETH9_ADDRESS } from './addresses'

export const WEVMOS = {
  // Mainly for unit tests
  1: new Token(1, WETH9_ADDRESS[4], 18, 'WEVMOS', 'Wrapped Evmos'),
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, WETH9_ADDRESS[ChainId.MAINNET], 18, 'WEVMOS', 'Wrapped Evmos'),
  [ChainId.TESTNET]: new Token(ChainId.TESTNET, WETH9_ADDRESS[ChainId.TESTNET], 18, 'WEVMOS', 'Wrapped Evmos'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, WETH9_ADDRESS[ChainId.RINKEBY], 18, 'WEVMOS', 'Wrapped Evmos'),
}
export const WETH9 = WEVMOS

export class Evmos extends NativeCurrency {
  protected constructor(chainId: number) {
    super(chainId, 18, 'EVMOS', 'Evmos')
  }

  public get wrapped(): Token {
    const weth9 = WEVMOS[this.chainId as ChainId]
    invariant(!!weth9, 'WRAPPED')
    return weth9
  }

  private static _etherCache: { [chainId: number]: Evmos } = {}

  public static onChain(chainId: number): Evmos {
    return this._etherCache[chainId] ?? (this._etherCache[chainId] = new Evmos(chainId))
  }

  public equals(other: NativeCurrency | Token): boolean {
    return other.isNative && other.chainId === this.chainId
  }
}
