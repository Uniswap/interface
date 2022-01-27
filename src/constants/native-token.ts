import { ChainId } from './chains'
import { Token } from '../sdk-core/entities/token'
import { NativeCurrency } from '../sdk-core/entities/nativeCurrency'
import invariant from 'tiny-invariant'

export const WPHOTON = makeToken('Wrapped Evmos', 'WEVMOS', 18, '0xbc0b8C49443E309528a7F21211933A58096B866c')
export const WETH9 = WPHOTON

function makeToken(name: string, symbol: string, decimals: number, mainAddress: string, testNetAddress?: string) {
  return {
    [ChainId.MAINNET]: new Token(ChainId.MAINNET, mainAddress, decimals, symbol, name),
    [ChainId.TESTNET]: new Token(ChainId.TESTNET, testNetAddress || mainAddress, decimals, symbol, name),
  }
}

export class Photon extends NativeCurrency {
  protected constructor(chainId: number) {
    super(chainId, 18, 'ETH', 'Ether')
  }

  public get wrapped(): Token {
    const weth9 = WPHOTON[this.chainId as ChainId]
    invariant(!!weth9, 'WRAPPED')
    return weth9
  }

  private static _etherCache: { [chainId: number]: Photon } = {}

  public static onChain(chainId: number): Photon {
    return this._etherCache[chainId] ?? (this._etherCache[chainId] = new Photon(chainId))
  }

  public equals(other: NativeCurrency | Token): boolean {
    return other.isNative && other.chainId === this.chainId
  }
}
