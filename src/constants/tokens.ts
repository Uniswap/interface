import { Token } from '@uniswap/sdk-core'
import { UNI_ADDRESS } from './addresses'
import { ChainId } from 'constants/chains'

export const AMPL = new Token(ChainId.MAINNET, '0xD46bA6D942050d489DBd938a2C909A5d5039A161', 9, 'AMPL', 'Ampleforth')
export const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
export const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C')
export const USDT = new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD')
export const WBTC = new Token(ChainId.MAINNET, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 8, 'WBTC', 'Wrapped BTC')
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
  [ChainId.TESTNET]: new Token(ChainId.MAINNET, UNI_ADDRESS[ChainId.TESTNET], 18, 'UNI', 'Uniswap'),
}

/**
 * Adapted from core-sdk
 * https://github.com/Uniswap/sdk-core/blob/d61d31e5f6e79e174f3e4226c04e8c5cfcf3e227/src/entities/token.ts
 * @TODO: adapt to real wrapped tokens
 */
export const WETH9 = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0xbc0b8C49443E309528a7F21211933A58096B866c',
    18,
    'WETH9',
    'Wrapped Evmos'
  ),
  [ChainId.TESTNET]: new Token(
    ChainId.TESTNET,
    '0xbc0b8C49443E309528a7F21211933A58096B866c',
    18,
    'WETH9',
    'Wrapped Evmos'
  ),
}

class NativeToken extends Token {
  isEther = true as any
  isToken = false as any
  constructor(chainId: number, address: string, decimals: number, symbol: string, name: string) {
    super(chainId, address, decimals, symbol, name)
  }
}

export const PHOTON = new NativeToken(
  ChainId.TESTNET,
  '0x09a3ecafa817268f77be1283176b946c4ff2e608',
  18,
  'PHOTON',
  'Evmos'
)
