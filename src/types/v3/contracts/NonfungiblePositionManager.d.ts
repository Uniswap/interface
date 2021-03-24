import { Contract } from '@ethersproject/contracts'

export interface NonfungiblePositionManager extends Contract {
  balanceOf(address: string): Promise<BigNumber>
  tokenOfOwnerByIndex(address: string, index: BigNumber): Promise<BigNumber>
}
