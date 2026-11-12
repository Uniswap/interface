import type { HookPermissions } from '@uniswap/v4-sdk'
import type { AppTFunction } from 'utilities/src/i18n/types'

type HookPermissionKey = keyof HookPermissions

interface HookPermissionPresentation {
  key: HookPermissionKey
  label: string
  description: string
}

// TODO(CONS-4014): derive from the one hook flag list shared with getFlagWarnings and getActiveHookFlags
export function getHookPermissionPresentation(t: AppTFunction): HookPermissionPresentation[] {
  const permissions = {
    beforeInitialize: {
      label: t('hooks.permissions.beforeInitialize'),
      description: t('hooks.permissions.beforeInitialize.description'),
    },
    afterInitialize: {
      label: t('hooks.permissions.afterInitialize'),
      description: t('hooks.permissions.afterInitialize.description'),
    },
    beforeAddLiquidity: {
      label: t('hooks.permissions.beforeAddLiquidity'),
      description: t('hooks.permissions.beforeAddLiquidity.description'),
    },
    afterAddLiquidity: {
      label: t('hooks.permissions.afterAddLiquidity'),
      description: t('hooks.permissions.afterAddLiquidity.description'),
    },
    beforeRemoveLiquidity: {
      label: t('hooks.permissions.beforeRemoveLiquidity'),
      description: t('hooks.permissions.beforeRemoveLiquidity.description'),
    },
    afterRemoveLiquidity: {
      label: t('hooks.permissions.afterRemoveLiquidity'),
      description: t('hooks.permissions.afterRemoveLiquidity.description'),
    },
    beforeSwap: {
      label: t('hooks.permissions.beforeSwap'),
      description: t('hooks.permissions.beforeSwap.description'),
    },
    afterSwap: {
      label: t('hooks.permissions.afterSwap'),
      description: t('hooks.permissions.afterSwap.description'),
    },
    beforeDonate: {
      label: t('hooks.permissions.beforeDonate'),
      description: t('hooks.permissions.beforeDonate.description'),
    },
    afterDonate: {
      label: t('hooks.permissions.afterDonate'),
      description: t('hooks.permissions.afterDonate.description'),
    },
    // Figma labels use ReturnDelta; SDK field names use ReturnsDelta.
    beforeSwapReturnsDelta: {
      label: t('hooks.permissions.beforeSwapReturnsDelta'),
      description: t('hooks.permissions.beforeSwapReturnsDelta.description'),
    },
    afterSwapReturnsDelta: {
      label: t('hooks.permissions.afterSwapReturnsDelta'),
      description: t('hooks.permissions.afterSwapReturnsDelta.description'),
    },
    afterAddLiquidityReturnsDelta: {
      label: t('hooks.permissions.afterAddLiquidityReturnsDelta'),
      description: t('hooks.permissions.afterAddLiquidityReturnsDelta.description'),
    },
    afterRemoveLiquidityReturnsDelta: {
      label: t('hooks.permissions.afterRemoveLiquidityReturnsDelta'),
      description: t('hooks.permissions.afterRemoveLiquidityReturnsDelta.description'),
    },
  } satisfies Record<HookPermissionKey, Omit<HookPermissionPresentation, 'key'>>

  return Object.entries(permissions).map(([key, permission]) => ({ ...permission, key: key as HookPermissionKey }))
}
