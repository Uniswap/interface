import { ChainId, Currency, Ether, NativeCurrency, Token, WETH } from '@kyberswap/ks-sdk-core'

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

function isOptimism(chainId: number): chainId is ChainId.OPTIMISM {
  return chainId === ChainId.OPTIMISM
}

class OptimismNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isOptimism(this.chainId)) throw new Error('Not OPTIMISM')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isOptimism(chainId)) throw new Error('Not OPTIMISM')
    super(chainId, 18, 'ETH', 'ETH')
  }
}

function isETHW(chainId: number): chainId is ChainId.ETHW {
  return chainId === ChainId.ETHW
}

class ETHWNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isETHW(this.chainId)) throw new Error('Not ETHW')
    return WETH[this.chainId]
  }

  public constructor(chainId: number) {
    if (!isETHW(chainId)) throw new Error('Not ETHW')
    super(chainId, 18, 'ETHW', 'Ethereum PoW')
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
      : isOptimism(chainId)
      ? new OptimismNativeCurrency(chainId)
      : isETHW(chainId)
      ? new ETHWNativeCurrency(chainId)
      : ExtendedEther.onChain(chainId))
  )
}

const STABLE_COINS = {
  [ChainId.MAINNET]: [
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0x4Fabb145d64652a948d72533023f6E7A623C7C53', // BUSD
  ],
  [ChainId.MATIC]: [
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', //DAI
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', //usdc
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', //usdt
    '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1', //MAI
  ],
  [ChainId.BSCMAINNET]: [
    '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', //dai
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // usdc
    '0x55d398326f99059fF775485246999027B3197955', //usdt
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // busd
  ],
  [ChainId.AVAXMAINNET]: [
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDt
    '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', // usdt.e
    '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', // usdc.e
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', //usdc
    '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', //dai.e
  ],
  [ChainId.FANTOM]: [
    '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', //dai
    '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', //usdc
    '0x049d68029688eAbF473097a2fC38ef61633A3C7A', // fusdt
    '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', // 'dai'
  ],
  [ChainId.CRONOS]: [
    '0xF2001B145b43032AAF5Ee2884e456CCd805F677D', // dai
    '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', //usdc
    '0x66e428c3f67a68878562e79A0234c1F83c208770', //'usdt'
  ],
  [ChainId.ARBITRUM]: [
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', //dai
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', //usdc
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', //usdt
  ],
  [ChainId.BTTC]: [
    '0x9B5F27f6ea9bBD753ce3793a07CbA3C74644330d', // usdt_b
    '0xdB28719F7f938507dBfe4f0eAe55668903D34a15', // usdt_t
    '0xE887512ab8BC60BcC9224e1c3b5Be68E26048B8B', //usdt_e
    '0x935faA2FCec6Ab81265B301a30467Bbc804b43d3', // usdc_t
    '0xCa424b845497f7204D9301bd13Ff87C0E2e86FCF', // usdc_b
    '0xAE17940943BA9440540940DB0F1877f101D39e8b', // usdc_e
    '0xe7dC549AE8DB61BDE71F22097BEcc8dB542cA100', //dai_e
    '0x17F235FD5974318E4E2a5e37919a209f7c37A6d1', // usdd_t
  ],
  [ChainId.VELAS]: [
    '0xe2C120f188eBd5389F71Cf4d9C16d05b62A58993', // usdc
    '0x01445C31581c354b7338AC35693AB2001B50b9aE', //usdt
  ],
  [ChainId.AURORA]: [
    '0xe3520349F477A5F6EB06107066048508498A291b', //Dai
    '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802', //'usdc'
    '0x4988a896b1227218e4A686fdE5EabdcAbd91571f', //usdt
  ],
  [ChainId.OASIS]: [
    '0x80A16016cC4A2E6a2CACA8a4a498b1699fF0f844', //usdc
    '0xdC19A122e268128B5eE20366299fc7b5b199C8e3', //usdtet
    '0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C', //busd
    '0x6Cb9750a92643382e020eA9a170AbB83Df05F30B', // usdt
  ],
  [ChainId.OPTIMISM]: [
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Dai
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', //usdt
    '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', //usdc
  ],
}

const handler = {
  get: function (target: any, name: string) {
    return target.hasOwnProperty(name) ? target[name] : []
  },
}

export const STABLE_COINS_ADDRESS: { [chainId in ChainId]: string[] } = new Proxy(STABLE_COINS, handler)
