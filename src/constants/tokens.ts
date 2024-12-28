import { ChainId, Token } from '@alagunoff/uniswap-sdk-core'
import { UNI_ADDRESS } from './addresses'

export const AMPL = new Token(ChainId.MAINNET, '0xD46bA6D942050d489DBd938a2C909A5d5039A161', 9, 'AMPL', 'Ampleforth')
export const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
export const USDC = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C'),
  [ChainId.POLYGON_AMOY]: new Token(
    ChainId.POLYGON_AMOY,
    '0x24BD3A3EeabC51f11Ff724F4D0ed4b52569952c2',
    6,
    'USDC',
    'USDC'
  ),
}

export const USDT = new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD')
export const USDT_POLYGON_AMOY = new Token(
  ChainId.POLYGON_AMOY,
  '0xF0602a35Fd6895bd62cDB4158BaC82689490afCE',
  6,
  'USDT',
  'Tether'
)
export const WBTC = new Token(ChainId.MAINNET, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 8, 'WBTC', 'Wrapped BTC')
export const WBTC_POLYGON_AMOY = new Token(
  ChainId.POLYGON_AMOY,
  '0xDcaA4611e721ce9a06D568A0E45dfbBA161A28BA',
  8,
  'WBTC',
  'Wrapped Bitcoin'
)
export const FEI = new Token(ChainId.MAINNET, '0x956F47F50A910163D8BF957Cf5846D573E7f87CA', 18, 'FEI', 'Fei USD')
export const TRIBE = new Token(ChainId.MAINNET, '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', 18, 'TRIBE', 'Tribe')
export const FRAX = new Token(ChainId.MAINNET, '0x853d955aCEf822Db058eb8505911ED77F175b99e', 18, 'FRAX', 'Frax')
export const FXS = new Token(ChainId.MAINNET, '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0', 18, 'FXS', 'Frax Share')
export const renBTC = new Token(ChainId.MAINNET, '0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D', 8, 'renBTC', 'renBTC')
export const UMA = new Token(
  ChainId.MAINNET,
  '0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828',
  18,
  'UMA',
  'UMA Voting Token v1'
)
// Mirror Protocol compat.
export const UST = new Token(ChainId.MAINNET, '0xa47c8bf37f92abed4a126bda807a7b7498661acd', 18, 'UST', 'Wrapped UST')
export const MIR = new Token(ChainId.MAINNET, '0x09a3ecafa817268f77be1283176b946c4ff2e608', 18, 'MIR', 'Wrapped MIR')
export const UNI: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, UNI_ADDRESS[ChainId.MAINNET], 18, 'UNI', 'Uniswap'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, UNI_ADDRESS[ChainId.RINKEBY], 18, 'UNI', 'Uniswap'),
  [ChainId.ROPSTEN]: new Token(ChainId.ROPSTEN, UNI_ADDRESS[ChainId.ROPSTEN], 18, 'UNI', 'Uniswap'),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, UNI_ADDRESS[ChainId.GÖRLI], 18, 'UNI', 'Uniswap'),
  [ChainId.KOVAN]: new Token(ChainId.KOVAN, UNI_ADDRESS[ChainId.KOVAN], 18, 'UNI', 'Uniswap'),
  [ChainId.POLYGON_AMOY]: new Token(ChainId.POLYGON_AMOY, UNI_ADDRESS[ChainId.POLYGON_AMOY], 18, 'UNI', 'Uniswap'),
}

export const METALAMP = new Token(
  ChainId.POLYGON_AMOY,
  '0x9d88cEdB5E1E7B09Df99e70580Fd36253Cd0690D',
  18,
  'METALAMP',
  'MetaLamp fun'
)
export const BNB = new Token(ChainId.POLYGON_AMOY, '0xF61C6c1F4866C1296E2d239e9AEb20036272C3DD', 18, 'BNB', 'BNB')
export const SHIB = new Token(
  ChainId.POLYGON_AMOY,
  '0x36fE2Bdb44f043034cb45A83C514a93a50b10489',
  18,
  'SHIB',
  'Shiba Inu'
)
