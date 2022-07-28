import { ChainId } from 'src/constants/chains'
import { DAI, DAI_RINKEBY, UNI, USDC } from 'src/constants/tokens'

export enum PermitType {
  AMOUNT = 1,
  ALLOWED = 2,
}

export interface PermitData {
  type: PermitType
  name: string
  version?: string // version is optional and if omitted will not be included in the domain
}

export const PERMITTABLE_TOKENS: {
  [chainId: number]: {
    [checksummedTokenAddress: string]: PermitData
  }
} = {
  [ChainId.Mainnet]: {
    [USDC.address]: { type: PermitType.AMOUNT, name: 'USD Coin', version: '2' },
    [DAI.address]: { type: PermitType.ALLOWED, name: 'Dai Stablecoin', version: '1' },
    [UNI[1].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
  },
  [ChainId.Rinkeby]: {
    [DAI_RINKEBY.address]: { type: PermitType.ALLOWED, name: 'Dai Stablecoin', version: '1' },
    [UNI[4].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
  },
  [ChainId.Ropsten]: {
    [UNI[3].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
    '0x07865c6E87B9F70255377e024ace6630C1Eaa37F': {
      type: PermitType.AMOUNT,
      name: 'USD Coin',
      version: '2',
    },
  },
  [ChainId.Goerli]: {
    [UNI[5].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
  },
  [ChainId.Kovan]: {
    [UNI[42].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
  },
}
