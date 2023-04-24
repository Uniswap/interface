import { ChainId } from 'src/constants/chains'
import { DAI, UNI, USDC } from 'src/constants/tokens'

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
    [UNI[ChainId.Mainnet].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
  },
  [ChainId.Goerli]: {
    [UNI[ChainId.Goerli].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
  },
}
