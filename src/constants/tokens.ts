import { ChainId, NativeCurrency, Currency, Token, WETH, Ether } from '@kyberswap/ks-sdk-core'

function isCro(chainId: number): chainId is ChainId.CRONOS {
  return chainId === ChainId.CRONOS
}

class CronosNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isCro(this.chainId)) throw new Error('Not CRO')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isCro(chainId)) throw new Error('Not CRO')
    super(chainId, 18, 'CRO', 'CRO')
  }
}

function isFtm(chainId: number): chainId is ChainId.FANTOM {
  return chainId === ChainId.FANTOM
}

class FtmNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isFtm(this.chainId)) throw new Error('Not FTM')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isFtm(chainId)) throw new Error('Not FTM')
    super(chainId, 18, 'FTM', 'FTM')
  }
}

function isBNB(chainId: number): chainId is ChainId.BSCMAINNET | ChainId.BSCTESTNET {
  return chainId === ChainId.BSCMAINNET || chainId === ChainId.BSCTESTNET
}

class BNBNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isBNB(this.chainId)) throw new Error('Not BNB')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isBNB(chainId)) throw new Error('Not BNB')
    super(chainId, 18, 'BNB', 'BNB')
  }
}

function isAvax(chainId: number): chainId is ChainId.AVAXMAINNET | ChainId.AVAXTESTNET {
  return chainId === ChainId.AVAXMAINNET || chainId === ChainId.AVAXTESTNET
}

class AvaxNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isAvax(this.chainId)) throw new Error('Not Avax')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isAvax(chainId)) throw new Error('Not Avax')
    super(chainId, 18, 'AVAX', 'AVAX')
  }
}

function isMatic(chainId: number): chainId is ChainId.MATIC | ChainId.MUMBAI {
  return chainId === ChainId.MUMBAI || chainId === ChainId.MATIC
}

class MaticNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isMatic(this.chainId)) throw new Error('Not matic')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isMatic(chainId)) throw new Error('Not matic')
    super(chainId, 18, 'MATIC', 'Polygon Matic')
  }
}

function isBTTC(chainId: number): chainId is ChainId.BTTC {
  return chainId === ChainId.BTTC
}

class BttNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isBTTC(this.chainId)) throw new Error('Not BTT')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isBTTC(chainId)) throw new Error('Not BTT')
    super(chainId, 18, 'BTT', 'BTT')
  }
}

function isVelas(chainId: number): chainId is ChainId.VELAS {
  return chainId === ChainId.VELAS
}

class VelasNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isVelas(this.chainId)) throw new Error('Not Velas')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isVelas(chainId)) throw new Error('Not Velas')
    super(chainId, 18, 'VLX', 'Velas')
  }
}

function isOasis(chainId: number): chainId is ChainId.OASIS {
  return chainId === ChainId.OASIS
}

class OasisNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isOasis(this.chainId)) throw new Error('Not OASIS')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isOasis(chainId)) throw new Error('Not OASIS')
    super(chainId, 18, 'ROSE', 'ROSE')
  }
}

export class ExtendedEther extends Ether {
  public get wrapped(): Token {
    if (this.chainId in WETH) return WETH[this.chainId as ChainId]
    throw new Error('Unsupported chain ID')
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency } = {}
export function nativeOnChain(chainId: number): NativeCurrency {
  return (
    cachedNativeCurrency[chainId] ??
    (cachedNativeCurrency[chainId] = isMatic(chainId)
      ? new MaticNativeCurrency(chainId)
      : isAvax(chainId)
      ? new AvaxNativeCurrency(chainId)
      : isFtm(chainId)
      ? new FtmNativeCurrency(chainId)
      : isBNB(chainId)
      ? new BNBNativeCurrency(chainId)
      : isCro(chainId)
      ? new CronosNativeCurrency(chainId)
      : isBTTC(chainId)
      ? new BttNativeCurrency(chainId)
      : isVelas(chainId)
      ? new VelasNativeCurrency(chainId)
      : isOasis(chainId)
      ? new OasisNativeCurrency(chainId)
      : ExtendedEther.onChain(chainId))
  )
}
