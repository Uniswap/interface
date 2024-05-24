import { Percent } from '@ubeswap/sdk-core'
import JSBI from 'jsbi'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// TODO(WEB-1984): Convert the deadline to minutes and remove unecessary conversions from
// seconds to minutes in the codebase.
// 10 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 10
export const L2_DEADLINE_FROM_NOW = 60 * 5

// transaction popup dismissal amounts
export const DEFAULT_TXN_DISMISS_MS = 10000
export const L2_TXN_DISMISS_MS = 5000

export const BIG_INT_ZERO = JSBI.BigInt(0)

export const BIPS_BASE = 10_000

// one basis JSBI.BigInt
export const ONE_BIPS = new Percent(JSBI.BigInt(1), BIPS_BASE)

// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(1, 100) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(3, 100) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(5, 100) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(10, 100) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(15, 100) // 15%

export const ZERO_PERCENT = new Percent(0)
export const ONE_HUNDRED_PERCENT = new Percent(1)

export const KNOWN_ADDRESSES: Record<
  string,
  {
    name: string
    abi?: object[]
  }
> = {
  // Ubeswap
  // https://docs.ubeswap.org/code-and-contracts/contract-addresses
  '0x71e26d0E519D14591b9dE9a0fE9513A398101490': {
    name: 'UBE Token',
  },
  '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC': {
    name: 'UBE Token (Old)',
  },
  '0x471EcE3750Da237f93B8E339c536989b8978a438': {
    name: 'CELO',
  },
  '0x918146359264C492BD6934071c6Bd31C854EDBc3': {
    name: 'mcUSD',
  },
  '0x5Ed248077bD07eE9B530f7C40BE0c1dAE4c131C0': {
    name: 'Release UBE',
  },
  '0x62d5b84bE28a183aBB507E125B384122D2C25fAE': {
    name: 'Ubeswap Factory',
  },
  '0x9Ee3600543eCcc85020D6bc77EB553d1747a65D2': {
    name: 'Ubeswap Pool Manager',
  },
  '0x1BDB37DAA42E37bFCa4C5536AcF93b1173588981': {
    name: 'Ubeswap Executive Timelock',
  },
  '0x177B042b284dD9B830d4eb179695bCC14044fD1A': {
    name: 'Ubeswap Community Timelock',
  },
  '0xC45Cc58205132Fe29e0F96BAA3f4FA2BD88cD6D9': {
    name: 'Ubeswap Celo Reserve Timelock',
  },
  '0x489AAc7Cb9A3B233e4a289Ec92284C8d83d49c6f': {
    name: 'Ubeswap Founding Operator',
  },
  '0x97A9681612482A22b7877afbF8430EDC76159Cae': {
    name: 'Ubeswap Governance Fees Timelock',
  },
  '0xB58DA472Fd4ba76696DbF8Ba3cC23580C26093dA': {
    name: 'Ubeswap Multisig 1',
  },
}
