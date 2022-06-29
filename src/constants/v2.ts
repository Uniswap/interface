import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

export const FARM_CONTRACTS: { readonly [chainId in ChainId]?: Array<string> } = {
  [ChainId.BSCTESTNET]: [],
  [ChainId.RINKEBY]: ['0x13c8F670d3bbd4456870a2C49Bb927F166A977Bd'],
  [ChainId.ROPSTEN]: [],
}

export const ELASTIC_NOT_SUPPORTED: { [key: string]: string } = {
  [ChainId.AURORA]: t`Elastic is not supported on Aurora. Please switch to other chains`,
  // [ChainId.VELAS]: t`Elastic will be available soon`,
}

export enum VERSION {
  ELASTIC = 'elastic',
  CLASSIC = 'classic',
}
