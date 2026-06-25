import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useQueryState, useQueryStates } from 'nuqs'
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { Button, Flex, SpinningLoader, Text, TouchableArea, useMedia } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { Plus } from 'ui/src/components/icons/Plus'
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
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { PageLayout } from '~/features/Liquidity/Create/Container'
import { getNextFlowStep } from '~/features/Liquidity/Create/flowSteps'
import { FormStepsWrapper } from '~/features/Liquidity/Create/FormWrapper'
import { useEntryPointBreadcrumb } from '~/features/Liquidity/Create/hooks/useEntryPointBreadcrumb'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { useLPSlippageValue } from '~/features/Liquidity/Create/hooks/useLPSlippageValues'
import { usePoolProgressSteps } from '~/features/Liquidity/Create/hooks/usePoolProgressSteps'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { parseAsDepositState, parseAsPriceRangeState, parseAsStep } from '~/features/Liquidity/parsers/urlParsers'
import { PoolInfoCard } from '~/features/Liquidity/PoolInfoCard/PoolInfoCard'
import {
  PoolProgressIndicator,
  PoolProgressIndicatorHeader,
  SIDEBAR_WIDTH,
} from '~/features/Liquidity/PoolProgressIndicator/PoolProgressIndicator'
import { getProtocolVersionFromLabel, gqlToRestProtocolVersion } from '~/features/Liquidity/utils/protocolVersion'
import { type FlowState, resolveAddLiquidityRenderGuard } from '~/pages/AddLiquidity/addLiquidityRenderGuard'
import { PoolBrowser } from '~/pages/AddLiquidity/PoolBrowser'
import {
  CreateLiquidityContextProvider,
  useCreateLiquidityContext,
} from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { SharedCreateModals } from '~/pages/CreatePosition/CreatePosition'
import { CreatePositionTxContextProvider } from '~/pages/CreatePosition/CreatePositionTxContext'
import { PoolTableStoreContextProvider } from '~/pages/Explore/tables/Pools/poolTableStore'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

function resolveSelectedProtocolVersion(poolData: PoolData | undefined, fallback: ProtocolVersion): ProtocolVersion {
  if (!poolData) {
    return fallback
  }
  return gqlToRestProtocolVersion(poolData.protocolVersion) ?? ProtocolVersion.V4
}

export default function AddLiquidity(): JSX.Element {
  return (
    <ExploreTablesFilterStoreContextProvider>
      <PoolTableStoreContextProvider>
        <AddLiquidityContent />
      </PoolTableStoreContextProvider>
    </ExploreTablesFilterStoreContextProvider>
  )
}

function AddLiquidityContent(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const media = useMedia()
  const entryPointBreadcrumb = useEntryPointBreadcrumb()

  // --- Pool address from route params (present in States 2 & 3) ---
  const { poolAddress } = useParams<{ chainName: string; poolAddress: string }>()
  const chainIdFromUrl = useChainIdFromUrlParam()
  const chainInfo = chainIdFromUrl ? getChainInfo(chainIdFromUrl) : undefined

  // --- Step from URL query param (present in the form state) ---
  const [flowStep] = useQueryState('step', parseAsStep)

  // No pool in the route → browse the table; pool present → the position form.
  const flowState: FlowState = useMemo(() => {
    if (!poolAddress) {
      return 'browse'
    }
    return 'form'
  }, [poolAddress])

  // --- Pool data (fetched when poolAddress is present) ---
  const { data: poolData, loading: poolLoading } = usePoolData({
    poolIdOrAddress: normalizeAddress(poolAddress ?? '', AddressStringFormat.Lowercase),
    chainId: chainInfo?.id,
    isPoolAddress: isEVMAddress(poolAddress),
  })

  // --- URL token state (for immediate rendering before pool data loads) ---
  const liquidityUrlState = useLiquidityUrlState()
  const urlToken0 = liquidityUrlState.tokenA
  const urlToken1 = liquidityUrlState.tokenB
  const urlFee = liquidityUrlState.fee ?? undefined
  const urlHook = liquidityUrlState.hook ?? undefined
  const urlProtocolVersion = getProtocolVersionFromLabel(liquidityUrlState.protocolVersion) ?? ProtocolVersion.V4

  const location = useLocation()
  const handleBack = useCallback(() => {
    // Pop to the stored browse entry (filters intact) rather than pushing a fresh URL that the form's
    // nuqs hooks would rewrite and strip the filters from. No in-app history → fall back to the table.
    if (location.state && (location.state as { from?: string }).from) {
      navigate(-1)
    } else {
      navigate('/positions/add')
    }
  }, [navigate, location.state])

  const browseSteps = useMemo(
    () => [
      { label: t('addLiquidity.selectPool'), active: true },
      { label: t('position.step.range'), active: false },
    ],
    [t],
  )

  // A pool route with no `step` isn't a valid form state — send it back to the table.
  if (poolAddress && flowStep === null) {
    return <Navigate to="/positions/add" replace />
  }

  // --- Redirect / loading guards ---
  const renderGuard = resolveAddLiquidityRenderGuard({
    poolAddress,
    chainIdFromUrl,
    flowState,
    poolLoading,
    poolData: poolData ?? undefined,
    urlToken0,
    urlToken1,
    currenciesLoading: liquidityUrlState.loadingA || liquidityUrlState.loadingB,
  })

  if (renderGuard === 'redirect') {
    return <Navigate to="/positions/add" replace />
  }

  if (renderGuard === 'loading') {
    return (
      <Flex width="100%" minHeight={400} centered>
        <SpinningLoader size={40} />
      </Flex>
    )
  }

  return (
    <Trace logImpression page={InterfacePageName.AddLiquidity}>
      <PageLayout py="$spacing24">
        {/* Breadcrumbs */}
        <BreadcrumbNavContainer aria-label="breadcrumb-nav">
          <BreadcrumbNavLink to={entryPointBreadcrumb.to}>
            {entryPointBreadcrumb.label} <Chevron size="$icon.16" color="$neutral2" rotate="180deg" />
          </BreadcrumbNavLink>
          <Text color="$neutral1">{t('common.addLiquidity')}</Text>
        </BreadcrumbNavContainer>

        {/* Title row */}
        <Flex row justifyContent="space-between" alignItems="center" width="100%" mb="$spacing12">
          <Flex row alignItems="center" gap="$spacing8" grow>
            {flowState === 'form' && (
              <TouchableArea onPress={handleBack}>
                <BackArrow size="$icon.24" color="$neutral1" />
              </TouchableArea>
            )}
            <Text variant="heading3">{t('addLiquidity.choosePool')}</Text>
          </Flex>
          <Button
            fill={false}
            emphasis="text-only"
            icon={<Plus color="$neutral2" />}
            onPress={() => navigate('/positions/add/new')}
          >
            <Button.Text color="$neutral2">{t('addLiquidity.createPool')}</Button.Text>
          </Button>
        </Flex>

        {/* Two-column layout */}
        <Flex row gap="$spacing20" justifyContent="space-between" width="100%" mt="$spacing16">
          {/* Left sidebar — hidden on mobile. The wrapper stretches to the full row height (no
              alignSelf) so the sticky card inside has room to stick; see FormWrapper for the same pattern. */}
          {!media.xl && (
            <Flex width={SIDEBAR_WIDTH}>
              {flowState === 'browse' && <PoolProgressIndicator steps={browseSteps} stickyTopOffset={0} />}
              {flowState === 'form' && <PoolInfoCard poolData={poolData ?? undefined} loading={poolLoading} />}
            </Flex>
          )}

          {/* Right content — fills the available width within the page's max-width */}
          <Flex flex={1} mb="$spacing28">
            {flowState !== 'form' ? (
              <PoolBrowserPane browseSteps={browseSteps} />
            ) : (
              <AddLiquidityFormContent
                chainId={chainIdFromUrl!}
                poolData={poolData ?? undefined}
                urlToken0={urlToken0}
                urlToken1={urlToken1}
                urlProtocolVersion={urlProtocolVersion}
                urlFee={urlFee}
                urlHook={urlHook}
                initialFlowStep={flowStep ?? PositionFlowStep.PRICE_RANGE}
              />
            )}
          </Flex>
        </Flex>
      </PageLayout>
    </Trace>
  )
}

function PoolBrowserPane({ browseSteps }: { browseSteps: { label: string; active: boolean }[] }) {
  const media = useMedia()
  return (
    <>
      {media.xl && <PoolProgressIndicatorHeader steps={browseSteps} />}
      <PoolBrowser />
    </>
  )
}

function AddLiquidityFormContent({
  chainId,
  poolData,
  urlToken0,
  urlToken1,
  urlProtocolVersion,
  urlFee,
  urlHook,
  initialFlowStep,
}: {
  chainId: UniverseChainId
  poolData?: PoolData
  urlToken0?: Currency
  urlToken1?: Currency
  urlProtocolVersion: ProtocolVersion
  urlFee?: FeeData
  urlHook?: string
  initialFlowStep: PositionFlowStep
}) {
  const protocolVersion = resolveSelectedProtocolVersion(poolData, urlProtocolVersion)

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

  const media = useMedia()

  return (
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
          initialFlowStep={initialFlowStep}
        >
          <CreatePositionTxContextProvider>
            {media.xl && <FormProgressIndicatorHeader />}
            {/* gap matches the legacy FormWrapper so the pool-info card and the form steps don't touch */}
            <Flex gap="$spacing24">
              <AddLiquidityPoolForm
                currencyInputs={currencyInputs}
                setCurrencyInputs={setCurrencyInputs}
                poolData={poolData}
              />
            </Flex>
            <SharedCreateModals />
          </CreatePositionTxContextProvider>
        </CreateLiquidityContextProvider>
      </LPTransactionSettingsStoreContextProvider>
    </MultichainContextProvider>
  )
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

  const handleContinue = useCallback(() => {
    setStep(getNextFlowStep({ currentStep: step, protocolVersion, creatingPoolOrPair: Boolean(creatingPoolOrPair) }))
  }, [creatingPoolOrPair, step, protocolVersion, setStep])

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

function FormProgressIndicatorHeader() {
  const steps = usePoolProgressSteps()
  return <PoolProgressIndicatorHeader steps={steps} />
}
