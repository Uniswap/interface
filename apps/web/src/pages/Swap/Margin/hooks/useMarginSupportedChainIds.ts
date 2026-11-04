import type { UniverseChainId } from '@universe/chains'
import { DynamicConfigs, MarginConfigKey, useDynamicConfigValue } from '@universe/gating'
import { useMemo } from 'react'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { isUniverseChainIdArrayType } from 'uniswap/src/features/gating/typeGuards'
import { MARGIN_CHAIN_ID } from '~/constants/margin'

const DEFAULT_MARGIN_CHAIN_IDS: UniverseChainId[] = [MARGIN_CHAIN_ID]

// The type guard only proves "array of numbers", so a chain this app doesn't know is dropped here. An
// empty or all-unknown list falls back to the default rather than offering margin on no chain.
export function resolveMarginSupportedChainIds(configured: number[]): UniverseChainId[] {
  const supported = configured.filter(isUniverseChainId)
  return supported.length > 0 ? supported : DEFAULT_MARGIN_CHAIN_IDS
}

/** Chains margin is offered on, from Statsig (`margin_config.supportedChainIds`); mainnet when unset. */
export function useMarginSupportedChainIds(): UniverseChainId[] {
  const configured = useDynamicConfigValue({
    config: DynamicConfigs.Margin,
    key: MarginConfigKey.SupportedChainIds,
    defaultValue: DEFAULT_MARGIN_CHAIN_IDS,
    customTypeGuard: isUniverseChainIdArrayType,
  })
  return useMemo(() => resolveMarginSupportedChainIds(configured), [configured])
}
