import { BigintIsh } from '@ubeswap/sdk-core'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'
import { TickMath } from '../utils'

export interface TickConstructorArgs {
  index: number
  liquidityGross: BigintIsh
  liquidityNet: BigintIsh
}

export class Tick {
  public readonly index: number
  public readonly liquidityGross: JSBI
  public readonly liquidityNet: JSBI

  constructor({ index, liquidityGross, liquidityNet }: TickConstructorArgs) {
    invariant(index >= TickMath.MIN_TICK && index <= TickMath.MAX_TICK, 'TICK')
    this.index = index
    this.liquidityGross = JSBI.BigInt(liquidityGross)
    this.liquidityNet = JSBI.BigInt(liquidityNet)
  }
}
