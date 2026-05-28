import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { createGetSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createGetV4SwapEnabled, useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'

export const DEFAULT_PROTOCOL_OPTIONS = [
  // `as const` allows us to derive a type narrower than ProtocolItems, and the `...` spread removes readonly, allowing DEFAULT_PROTOCOL_OPTIONS to be passed around as an argument without `readonly`
  ...([
    TradingApi.ProtocolItems.UNISWAPX_V2,
    TradingApi.ProtocolItems.V4,
    TradingApi.ProtocolItems.V3,
    TradingApi.ProtocolItems.V2,
  ] as const),
]
export type FrontendSupportedProtocol = (typeof DEFAULT_PROTOCOL_OPTIONS)[number]

const LAUNCHED_UNISWAPX_CHAINS = [UniverseChainId.Mainnet]

/** Given a list of `userSelectedProtocols`, returns protocol items that are allowed for the given chain. */
export function useProtocolsForChain(
  userSelectedProtocols: FrontendSupportedProtocol[],
  chainId?: UniverseChainId,
): TradingApi.ProtocolItems[] {
  const getIsUniswapXSupported = useUniswapContextSelector((state) => state.getIsUniswapXSupported)
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)
  const priorityOrdersAllowed = useUniswapXPriorityOrderFlag(chainId)
  const isDutchV3Enabled = useFeatureFlag(FeatureFlags.ArbitrumDutchV3)
  const v4SwapAllowed = useV4SwapEnabled(chainId)

  const protocolFilter = useMemo(
    () =>
      createProtocolFilter({
        getUniswapXEnabled: () => uniswapXEnabled,
        getIsUniswapXSupported,
        getPriorityOrderFlag: () => priorityOrdersAllowed,
        getV4Enabled: () => v4SwapAllowed,
        getArbitrumDutchV3Enabled: () => isDutchV3Enabled,
      }),
    [uniswapXEnabled, priorityOrdersAllowed, isDutchV3Enabled, v4SwapAllowed, getIsUniswapXSupported],
  )

  return useMemo(() => {
    return protocolFilter(userSelectedProtocols, chainId)
  }, [protocolFilter, userSelectedProtocols, chainId])
}

export function createProtocolFilter(ctx: {
  getUniswapXEnabled: () => boolean
  getIsUniswapXSupported?: (chainId?: UniverseChainId) => boolean
  getPriorityOrderFlag: (chainId?: UniverseChainId) => boolean
  getV4Enabled: (chainId?: UniverseChainId) => boolean
  getArbitrumDutchV3Enabled: () => boolean
}) {
  return function filterProtocols(
    protocols: FrontendSupportedProtocol[],
    chainId?: UniverseChainId,
  ): TradingApi.ProtocolItems[] {
    const uniswapXEnabled = ctx.getUniswapXEnabled()
    const uniswapXSupportedForChain = ctx.getIsUniswapXSupported ? ctx.getIsUniswapXSupported(chainId) : true
    const combinedUniswapXEnabled = uniswapXEnabled && uniswapXSupportedForChain

    const priorityOrdersAllowed = ctx.getPriorityOrderFlag(chainId)
    const arbDutchV3Enabled = chainId === UniverseChainId.ArbitrumOne && ctx.getArbitrumDutchV3Enabled()
    const v4Enabled = ctx.getV4Enabled(chainId)

    const uniswapXAllowedForChain =
      (chainId && LAUNCHED_UNISWAPX_CHAINS.includes(chainId)) || priorityOrdersAllowed || arbDutchV3Enabled

    let filteredProtocols: TradingApi.ProtocolItems[] = [...protocols]

    // Remove UniswapX from the options we send to TradingAPI if UniswapX hasn't been launched or isn't in experiment on that chain
    if (!uniswapXAllowedForChain || !combinedUniswapXEnabled) {
      filteredProtocols = filteredProtocols.filter((protocol) => protocol !== TradingApi.ProtocolItems.UNISWAPX_V2)
    }

    // Replace UniswapXV2 with V3 if V3 experiment is enabled on arbitrum
    if (arbDutchV3Enabled) {
      filteredProtocols = filteredProtocols.map((protocol) =>
        protocol === TradingApi.ProtocolItems.UNISWAPX_V2 ? TradingApi.ProtocolItems.UNISWAPX_V3 : protocol,
      )
    }

    if (!v4Enabled) {
      filteredProtocols = filteredProtocols.filter((protocol) => protocol !== TradingApi.ProtocolItems.V4)
    }

    return filteredProtocols
  }
}

export function useUniswapXPriorityOrderFlag(chainId?: UniverseChainId): boolean {
  if (!chainId) {
    return false
  }

  return getUniswapXPriorityOrderFlag(chainId)
}

export function createGetProtocolsForChain(ctx: {
  // these need to come from react unfortunately
  getIsUniswapXSupported?: (chainId?: UniverseChainId) => boolean
  getEnabledChains: () => UniverseChainId[]
}): (userSelectedProtocols: FrontendSupportedProtocol[], chainId?: UniverseChainId) => TradingApi.ProtocolItems[] {
  const uniswapXEnabled = getFeatureFlag(FeatureFlags.UniswapX)
  const isDutchV3Enabled = getFeatureFlag(FeatureFlags.ArbitrumDutchV3)

  const getV4SwapAllowed = createGetV4SwapEnabled({
    getSupportedChainId: createGetSupportedChainId({
      getChains: () => ctx.getEnabledChains(),
    }).getSupportedChainId,
  })

  const getProtocolsForChain = createProtocolFilter({
    getUniswapXEnabled: () => uniswapXEnabled,
    getIsUniswapXSupported: ctx.getIsUniswapXSupported,
    getPriorityOrderFlag: getUniswapXPriorityOrderFlag,
    getV4Enabled: getV4SwapAllowed,
    getArbitrumDutchV3Enabled: () => isDutchV3Enabled,
  })

  return getProtocolsForChain
}

export function createGetUniswapXPriorityOrderFlag(ctx: {
  getFeatureFlag: (flagName: FeatureFlags) => boolean
}): (chainId?: UniverseChainId) => boolean {
  return (chainId?: UniverseChainId) => {
    if (!chainId) {
      return false
    }

    switch (chainId) {
      case UniverseChainId.Base:
        return ctx.getFeatureFlag(FeatureFlags.UniswapXPriorityOrdersBase)
      case UniverseChainId.Optimism:
        return ctx.getFeatureFlag(FeatureFlags.UniswapXPriorityOrdersOptimism)
      case UniverseChainId.Unichain:
        return ctx.getFeatureFlag(FeatureFlags.UniswapXPriorityOrdersUnichain)
      default:
        return false
    }
  }
}

export const getUniswapXPriorityOrderFlag = createGetUniswapXPriorityOrderFlag({
  getFeatureFlag,
})
