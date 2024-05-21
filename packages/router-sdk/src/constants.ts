import { Percent } from '@ubeswap/sdk-core'
import JSBI from 'jsbi'

export const MSG_SENDER = '0x0000000000000000000000000000000000000001'
export const ADDRESS_THIS = '0x0000000000000000000000000000000000000002'

export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)

// = 1 << 23 or 100000000000000000000000
export const V2_FEE_PATH_PLACEHOLDER = 8388608

export const ZERO_PERCENT = new Percent(ZERO)
export const ONE_HUNDRED_PERCENT = new Percent(100, 100)
