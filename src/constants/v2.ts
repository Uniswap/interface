import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

export const FARM_CONTRACTS: { readonly [chainId in ChainId]?: Array<string> } = {
  [ChainId.BSCTESTNET]: [],
  [ChainId.RINKEBY]: ['0x13c8F670d3bbd4456870a2C49Bb927F166A977Bd'],
  [ChainId.ROPSTEN]: [],
  [ChainId.MATIC]: ['0xBdEc4a045446F583dc564C0A227FFd475b329bf0', '0x5C503D4b7DE0633f031229bbAA6A5e4A31cc35d8'],
  [ChainId.MAINNET]: ['0xb85ebE2e4eA27526f817FF33fb55fB240057C03F'],
  [ChainId.AVAXMAINNET]: ['0xBdEc4a045446F583dc564C0A227FFd475b329bf0', '0x5C503D4b7DE0633f031229bbAA6A5e4A31cc35d8'],
  [ChainId.ARBITRUM]: ['0xBdEc4a045446F583dc564C0A227FFd475b329bf0'],
  [ChainId.OPTIMISM]: ['0xb85ebE2e4eA27526f817FF33fb55fB240057C03F'],
}

export const ELASTIC_NOT_SUPPORTED: { [key: string]: string } = {
  [ChainId.AURORA]: t`Elastic is not supported on Aurora. Please switch to other chains`,
  // [ChainId.VELAS]: t`Elastic will be available soon`,
}

export enum VERSION {
  ELASTIC = 'elastic',
  CLASSIC = 'classic',
}

export const TOBE_EXTENDED_FARMING_POOLS: string[] = []
