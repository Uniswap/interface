import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useQueryState, useQueryStates } from 'nuqs'
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { Flex, SpinningLoader } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import type { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { usePoolData } from '~/appGraphql/data/pools/usePoolData'
import { gqlToCurrency } from '~/appGraphql/data/util'
import { FormStepsWrapper, FormWrapper } from '~/features/Liquidity/Create/FormWrapper'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
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

function parseProtocolVersion(value: string | null): ProtocolVersion {
  switch (value) {
    case 'v2':
      return ProtocolVersion.V2
    case 'v3':
      return ProtocolVersion.V3
    default:
      return ProtocolVersion.V4
  }
}

function AddLiquidityPoolForm({
  currencyInputs,
  setCurrencyInputs,
  poolData,
}: {
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
  poolData?: PoolData
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
      poolData={poolData}
    />
  )
}

function AddLiquidityPoolContent({
  chainId,
  poolData,
  poolLoading,
  urlToken0,
  urlToken1,
  urlProtocolVersion,
  urlFee,
  urlHook,
}: {
  chainId: UniverseChainId
  poolData?: PoolData
  poolLoading: boolean
  urlToken0?: Currency
  urlToken1?: Currency
  urlProtocolVersion: ProtocolVersion
  urlFee?: FeeData
  urlHook?: string
}) {
  const { t } = useTranslation()

  const protocolVersion = poolData
    ? (gqlToRestProtocolVersion(poolData.protocolVersion) ?? ProtocolVersion.V4)
    : urlProtocolVersion

  const { token0, token1 } = useMemo(() => {
    if (poolData) {
      return {
        token0: gqlToCurrency(poolData.token0),
        token1: gqlToCurrency(poolData.token1),
      }
    }
    return { token0: urlToken0, token1: urlToken1 }
  }, [poolData, urlToken0, urlToken1])

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

  const fee = poolData?.feeTier ?? urlFee
  const hook = poolData?.hookAddress ?? urlHook

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
              fee: fee ?? undefined,
              hook: hook ?? undefined,
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
                sidebar={<PoolInfoCard poolData={poolData} loading={poolLoading} />}
              >
                <AddLiquidityPoolForm
                  currencyInputs={currencyInputs}
                  setCurrencyInputs={setCurrencyInputs}
                  poolData={poolData}
                />
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

  const liquidityUrlState = useLiquidityUrlState()
  const urlToken0 = liquidityUrlState.tokenA
  const urlToken1 = liquidityUrlState.tokenB
  const urlFee = liquidityUrlState.fee ?? undefined
  const urlHook = liquidityUrlState.hook ?? undefined
  const urlProtocolVersion = parseProtocolVersion(liquidityUrlState.protocolVersion)

  const hasUrlTokens = !!urlToken0 && !!urlToken1

  if (!chainId) {
    return <Navigate to="/positions/add" replace />
  }

  // If we have URL params with token info, render immediately without waiting for poolData
  if (hasUrlTokens) {
    return (
      <AddLiquidityPoolContent
        chainId={chainId}
        poolData={poolData ?? undefined}
        poolLoading={loading}
        urlToken0={urlToken0}
        urlToken1={urlToken1}
        urlProtocolVersion={urlProtocolVersion}
        urlFee={urlFee}
        urlHook={urlHook}
      />
    )
  }

  // Fallback: no URL params (e.g. bookmarked URL), wait for poolData
  if (loading) {
    return (
      <Flex width="100%" minHeight={400} centered>
        <SpinningLoader size={40} />
      </Flex>
    )
  }

  if (!poolData) {
    return <Navigate to="/positions/add" replace />
  }

  return (
    <AddLiquidityPoolContent
      chainId={chainId}
      poolData={poolData}
      poolLoading={false}
      urlProtocolVersion={gqlToRestProtocolVersion(poolData.protocolVersion) ?? ProtocolVersion.V4}
    />
  )
}
