import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { type ReactNode, useMemo } from 'react'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { noop } from 'utilities/src/react/noop'
import type { PoolData } from '~/data/pools/poolData'
import { ExistingPoolLiquidityProvider } from '~/features/Liquidity/Create/ExistingPoolLiquidityProvider'
import { getNextFlowStep } from '~/features/Liquidity/Create/flowSteps'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { getCurrencyWithUnwrap } from '~/features/Liquidity/utils/currency'
import { PdpChartRangeProvider } from '~/pages/PoolDetails/components/LiquidityPanel/PdpChartRangeContext'
import { PdpFlowActivityProvider } from '~/pages/PoolDetails/components/LiquidityPanel/PdpFlowActivityContext'

/**
 * The pool details page's add-liquidity state: one create-position flow for this pool, mounted around
 * the whole page so the panel and the page's chart share one range. Renders its children without the
 * flow until the pool loads, since the flow is seeded from the pool's tokens exactly once, and for a pool
 * whose protocol version isn't known.
 */
export function PdpLiquidityProvider({
  poolData,
  chainId,
  priceInverted,
  children,
}: {
  poolData?: PoolData
  chainId: UniverseChainId
  /** The page's price orientation (its chart's `isReversed`); the flow's range editor follows it. */
  priceInverted: boolean
  children: ReactNode
}): JSX.Element {
  // An unknown version can't be guessed: it decides both the WETH unwrap and the flow's first step.
  const protocolVersion =
    poolData?.protocolVersion === ProtocolVersion.UNSPECIFIED ? undefined : poolData?.protocolVersion

  // v2/v3 pools are WETH-denominated onchain; deposit native ETH as the add route does.
  const { token0, token1 } = useMemo(
    () =>
      poolData && protocolVersion !== undefined
        ? {
            token0: getCurrencyWithUnwrap(v2TokenToCurrency(poolData.token0), protocolVersion),
            token1: getCurrencyWithUnwrap(v2TokenToCurrency(poolData.token1), protocolVersion),
          }
        : {},
    [poolData, protocolVersion],
  )

  if (!poolData || protocolVersion === undefined || !token0 || !token1) {
    return <>{children}</>
  }

  return (
    <ExistingPoolLiquidityProvider
      key={poolData.idOrAddress}
      chainId={chainId}
      poolData={poolData}
      token0={token0}
      token1={token1}
      protocolVersion={protocolVersion}
      fee={poolData.feeTier}
      hook={poolData.hookAddress}
      initialFlowStep={getNextFlowStep({
        currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
        protocolVersion,
        creatingPoolOrPair: false,
      })}
      priceInverted={priceInverted}
      // The panel is a single deposit surface that never moves between steps, so step changes from shared
      // flow code (e.g. a reset back to token selection) have nowhere to go.
      onStepChange={noop}
      // The review modal closes and clears the deposit itself; the user stays on the pool.
      onPositionCreated={noop}
    >
      <PdpFlowActivityProvider>
        <PdpChartRangeProvider>{children}</PdpChartRangeProvider>
      </PdpFlowActivityProvider>
    </ExistingPoolLiquidityProvider>
  )
}
