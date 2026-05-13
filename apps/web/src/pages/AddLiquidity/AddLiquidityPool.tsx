import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useQueryState, useQueryStates } from 'nuqs'
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { Flex, SpinningLoader } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import type { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { usePoolData } from '~/appGraphql/data/pools/usePoolData'
import { gqlToCurrency } from '~/appGraphql/data/util'
import { FormStepsWrapper, FormWrapper } from '~/features/Liquidity/Create/FormWrapper'
import { useLPSlippageValue } from '~/features/Liquidity/Create/hooks/useLPSlippageValues'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import {
  parseAsDepositState,
  parseAsPositionFlowStep,
  parseAsPriceRangeState,
} from '~/features/Liquidity/parsers/urlParsers'
import { PoolInfoCard } from '~/features/Liquidity/PoolInfoCard/PoolInfoCard'
import { gqlToRestProtocolVersion } from '~/features/Liquidity/utils/protocolVersion'
import {
  CreateLiquidityContextProvider,
  useCreateLiquidityContext,
} from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { SharedCreateModals } from '~/pages/CreatePosition/CreatePosition'
import { CreatePositionTxContextProvider } from '~/pages/CreatePosition/CreatePositionTxContext'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

function AddLiquidityPoolForm({
  currencyInputs,
  setCurrencyInputs,
}: {
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  const {
    positionState: { protocolVersion },
    creatingPoolOrPair,
    step,
    setStep,
  } = useCreateLiquidityContext()
  const v2Selected = protocolVersion === ProtocolVersion.V2

  const handleContinue = useCallback(() => {
    if (v2Selected) {
      if (step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER && creatingPoolOrPair) {
        setStep(PositionFlowStep.PRICE_RANGE)
      } else {
        setStep(PositionFlowStep.DEPOSIT)
      }
    } else {
      setStep(step + 1)
    }
  }, [creatingPoolOrPair, step, v2Selected, setStep])

  return (
    <FormStepsWrapper
      hideEditStepOnDesktop
      currencyInputs={currencyInputs}
      setCurrencyInputs={setCurrencyInputs}
      onSelectTokensContinue={handleContinue}
    />
  )
}

function AddLiquidityPoolContent({ poolData, chainId }: { poolData: PoolData; chainId: UniverseChainId }) {
  const { t } = useTranslation()

  const protocolVersion = gqlToRestProtocolVersion(poolData.protocolVersion) ?? ProtocolVersion.V4
  const { token0, token1 } = useMemo(
    () => ({
      token0: gqlToCurrency(poolData.token0),
      token1: gqlToCurrency(poolData.token1),
    }),
    [poolData],
  )

  const [currencyInputs, setCurrencyInputs] = useState<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>({
    tokenA: token0,
    tokenB: token1,
  })

  // Read step from URL so step navigation (setStep → URL update → re-render) works.
  // Default to PRICE_RANGE since token selection is skipped for existing pools.
  const [flowStep] = useQueryState(
    'step',
    parseAsPositionFlowStep.withDefault(PositionFlowStep.PRICE_RANGE).withOptions({
      history: 'push',
      clearOnDefault: false,
      shallow: false,
    }),
  )

  // Read price range and deposit state from URL for restore-on-refresh
  const [urlState] = useQueryStates({
    priceRangeState: parseAsPriceRangeState,
    depositState: parseAsDepositState,
  })

  const autoSlippageTolerance = useLPSlippageValue({
    version: protocolVersion,
    currencyA: token0,
    currencyB: token1,
  })

  return (
    <Trace logImpression page={InterfacePageName.AddLiquidity}>
      <MultichainContextProvider initialChainId={chainId}>
        <LPTransactionSettingsStoreContextProvider autoSlippageTolerance={autoSlippageTolerance}>
          <CreateLiquidityContextProvider
            currencyInputs={currencyInputs}
            setCurrencyInputs={setCurrencyInputs}
            initialPositionState={{
              fee: poolData.feeTier ?? undefined,
              hook: poolData.hookAddress ?? undefined,
              protocolVersion,
            }}
            initialPriceRangeState={urlState.priceRangeState}
            initialDepositState={urlState.depositState}
            initialFlowStep={flowStep}
          >
            <CreatePositionTxContextProvider>
              <FormWrapper
                title={t('addLiquidity.setYourPosition')}
                toolbar={<></>}
                sidebar={<PoolInfoCard poolData={poolData} />}
              >
                <AddLiquidityPoolForm currencyInputs={currencyInputs} setCurrencyInputs={setCurrencyInputs} />
              </FormWrapper>
              <SharedCreateModals />
            </CreatePositionTxContextProvider>
          </CreateLiquidityContextProvider>
        </LPTransactionSettingsStoreContextProvider>
      </MultichainContextProvider>
    </Trace>
  )
}

export default function AddLiquidityPool(): JSX.Element {
  const { poolAddress } = useParams<{ chainName: string; poolAddress: string }>()
  const chainId = useChainIdFromUrlParam()
  const chainInfo = chainId ? getChainInfo(chainId) : undefined

  const { data: poolData, loading } = usePoolData({
    poolIdOrAddress: normalizeAddress(poolAddress ?? '', AddressStringFormat.Lowercase),
    chainId: chainInfo?.id,
    isPoolAddress: isEVMAddress(poolAddress),
  })

  if (loading) {
    return (
      <Flex width="100%" minHeight={400} centered>
        <SpinningLoader size={40} />
      </Flex>
    )
  }

  if (!poolData || !chainId) {
    return <Navigate to="/positions/add" replace />
  }

  return <AddLiquidityPoolContent poolData={poolData} chainId={chainId} />
}
