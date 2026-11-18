import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from '@universe/chains'
import { type ReactNode, useState } from 'react'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import type { PoolData } from '~/data/pools/poolData'
import { CreateLiquidityContextProvider } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { CreatePositionTxContextProvider } from '~/features/Liquidity/Create/CreatePositionTxContext'
import { useLPSlippageValue } from '~/features/Liquidity/Create/hooks/useLPSlippageValues'
import { useSeedPositionFromPool } from '~/features/Liquidity/Create/hooks/useSeedPositionFromPool'
import type { PositionFlowStep, PriceRangeState } from '~/features/Liquidity/Create/types'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import type { DepositState } from '~/types/liquidity'

function SeedPositionFromPool({ poolData }: { poolData?: PoolData }): null {
  useSeedPositionFromPool(poolData)
  return null
}

/**
 * Mounts the create-position flow for a position in a pool that already exists: the provider stack the
 * `/positions/add/:chain/:pool` route uses, seeded from the pool. Surfaces that embed the flow elsewhere
 * pass `onStepChange` / `onPositionCreated` so it neither writes `?step` nor leaves the page on success.
 * Surface-specific modals (e.g. SharedCreateModals' hook review) stay with the caller.
 */
export function ExistingPoolLiquidityProvider({
  chainId,
  poolData,
  token0,
  token1,
  protocolVersion,
  fee,
  hook,
  initialFlowStep,
  initialPriceRangeState,
  initialDepositState,
  onStepChange,
  onPositionCreated,
  priceInverted,
  children,
}: {
  chainId: UniverseChainId
  poolData?: PoolData
  /** The pool's tokens as the surface displays them (native unwrapped where the pool allows it). */
  token0?: Currency
  token1?: Currency
  protocolVersion: ProtocolVersion
  fee?: FeeData
  hook?: string
  initialFlowStep: PositionFlowStep
  initialPriceRangeState?: Partial<PriceRangeState>
  initialDepositState?: Partial<DepositState>
  onStepChange?: (step: PositionFlowStep | null) => void
  onPositionCreated?: () => void
  /** The host's price orientation, which the flow follows; see `CreateLiquidityContextProvider`. */
  priceInverted?: boolean
  children: ReactNode
}): JSX.Element {
  const [currencyInputs, setCurrencyInputs] = useState<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>({
    tokenA: token0,
    tokenB: token1,
  })

  const autoSlippageTolerance = useLPSlippageValue({
    version: protocolVersion,
    currencyA: token0,
    currencyB: token1,
  })

  return (
    <MultichainContextProvider initialChainId={chainId}>
      <LPTransactionSettingsStoreContextProvider autoSlippageTolerance={autoSlippageTolerance}>
        <CreateLiquidityContextProvider
          currencyInputs={currencyInputs}
          setCurrencyInputs={setCurrencyInputs}
          initialPositionState={{ fee, hook, protocolVersion }}
          initialPriceRangeState={initialPriceRangeState}
          initialDepositState={initialDepositState}
          initialFlowStep={initialFlowStep}
          onStepChange={onStepChange}
          onPositionCreated={onPositionCreated}
          priceInverted={priceInverted}
        >
          <CreatePositionTxContextProvider>
            {children}
            {/* After children on purpose: effects run in tree order, so the pool's hook and fee are written
                after any child seeds them from the link (AddHook's `?hook=` on a `?step=0` deep link). */}
            <SeedPositionFromPool poolData={poolData} />
          </CreatePositionTxContextProvider>
        </CreateLiquidityContextProvider>
      </LPTransactionSettingsStoreContextProvider>
    </MultichainContextProvider>
  )
}
