import { GeneratedIcon } from 'ui/src'
import { Flag } from 'ui/src/components/icons/Flag'
import { Pools } from 'ui/src/components/icons/Pools'
import { SwapDotted } from 'ui/src/components/icons/SwapDotted'
import { AppTFunction } from 'ui/src/i18n/types'

export enum HookFlag {
  BeforeAddLiquidity = 'before-add-liquidity',
  AfterAddLiquidity = 'after-add-liquidity',
  BeforeRemoveLiquidity = 'before-remove-liquidity',
  AfterRemoveLiquidity = 'after-remove-liquidity',
  BeforeSwap = 'before-swap',
  AfterSwap = 'after-swap',
  BeforeDonate = 'before-donate',
  AfterDonate = 'after-donate',
  BeforeSwapReturnsDelta = 'before-swap-returns-delta',
  AfterSwapReturnsDelta = 'after-swap-returns-delta',
  AfterAddLiquidityReturnsDelta = 'after-add-liquidity-returns-delta',
  AfterRemoveLiquidityReturnsDelta = 'after-remove-liquidity-returns-delta',
}

// The flags are ordered with the dangerous ones on top so they are rendered first
const FLAGS: { [key in HookFlag]: number } = {
  [HookFlag.BeforeRemoveLiquidity]: 1 << 9,
  [HookFlag.AfterRemoveLiquidity]: 1 << 8,
  [HookFlag.BeforeAddLiquidity]: 1 << 11,
  [HookFlag.AfterAddLiquidity]: 1 << 10,
  [HookFlag.BeforeSwap]: 1 << 7,
  [HookFlag.AfterSwap]: 1 << 6,
  [HookFlag.BeforeDonate]: 1 << 5,
  [HookFlag.AfterDonate]: 1 << 4,
  [HookFlag.BeforeSwapReturnsDelta]: 1 << 3,
  [HookFlag.AfterSwapReturnsDelta]: 1 << 2,
  [HookFlag.AfterAddLiquidityReturnsDelta]: 1 << 1,
  [HookFlag.AfterRemoveLiquidityReturnsDelta]: 1 << 0,
}

export function getFlagsFromContractAddress(contractAddress: Address): HookFlag[] {
  // Extract the last 4 hexadecimal digits from the address
  const last4Hex = contractAddress.slice(-4)

  // Convert the hex string to a binary string
  const binaryStr = parseInt(last4Hex, 16).toString(2)

  // Parse the last 12 bits of the binary string
  const relevantBits = binaryStr.slice(-12)

  // Determine which flags are active
  const activeFlags = Object.entries(FLAGS)
    .filter(([, bitPosition]) => (parseInt(relevantBits, 2) & bitPosition) !== 0)
    .map(([flag]) => flag as HookFlag)

  return activeFlags
}

export interface FlagWarning {
  Icon: GeneratedIcon
  name: string
  info: string
  dangerous: boolean
}

export function getFlagWarning(flag: HookFlag, t: AppTFunction): FlagWarning | undefined {
  switch (flag) {
    case HookFlag.BeforeSwap:
    case HookFlag.BeforeSwapReturnsDelta:
      return {
        Icon: SwapDotted,
        name: t('common.swap'),
        info: t('position.hook.swapWarning'),
        dangerous: false,
      }
    case HookFlag.BeforeAddLiquidity:
    case HookFlag.AfterAddLiquidity:
      return {
        Icon: Pools,
        name: t('common.addLiquidity'),
        info: t('position.hook.liquidityWarning'),
        dangerous: false,
      }
    case HookFlag.BeforeRemoveLiquidity:
    case HookFlag.AfterRemoveLiquidity:
      return {
        Icon: Flag,
        name: t('common.warning'),
        info: t('position.hook.removeWarning'),
        dangerous: true,
      }
    case HookFlag.BeforeDonate:
    case HookFlag.AfterDonate:
      return {
        Icon: Flag,
        name: t('common.donate'),
        info: t('position.hook.donateWarning'),
        dangerous: false,
      }
    default:
      return undefined
  }
}
