import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { type UniverseChainId, AddressStringFormat, normalizeAddress } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useQueryState, useQueryStates } from 'nuqs'
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { Button, SpinningLoader } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { STICKY_HEADER_TOP_GAP } from '~/components/Table/constants'
import type { PoolData } from '~/data/pools/poolData'
import { useLiquidityServicePoolData } from '~/data/pools/useLiquidityServicePoolData'
import { PageLayout } from '~/features/Liquidity/Create/Container'
import { CreatePositionHeader } from '~/features/Liquidity/Create/CreatePositionHeader'
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
import { canUnwrapCurrency, getCurrencyWithOptionalUnwrap } from '~/features/Liquidity/utils/currency'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'
import { type FlowState, resolveAddLiquidityRenderGuard } from '~/pages/AddLiquidity/addLiquidityRenderGuard'
import { PoolBrowser } from '~/pages/AddLiquidity/PoolBrowser'
import { ADD_LIQUIDITY_PATH } from '~/pages/AddLiquidity/poolLinkParams'
import { useCreatePoolHrefFromSelection } from '~/pages/AddLiquidity/useCreatePoolHrefFromSelection'
import { useSeedPositionFromPool } from '~/pages/AddLiquidity/useSeedPositionFromPool'
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
  return poolData.protocolVersion ?? ProtocolVersion.V4
}

export default function AddLiquidity(): JSX.Element {
  return (
    <PoolTableStoreContextProvider>
      <AddLiquidityContent />
    </PoolTableStoreContextProvider>
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
  const { data: poolData, loading: poolLoading } = useLiquidityServicePoolData({
    poolIdOrAddress: normalizeAddress(poolAddress ?? '', AddressStringFormat.Lowercase),
    chainId: chainInfo?.id,
    disabled: !poolAddress,
  })

  // --- URL token state (for immediate rendering before pool data loads) ---
  const liquidityUrlState = useLiquidityUrlState()
  const urlToken0 = liquidityUrlState.tokenA
  const urlToken1 = liquidityUrlState.tokenB
  const urlFee = liquidityUrlState.fee ?? undefined
  const urlHook = liquidityUrlState.hook ?? undefined
  const urlProtocolVersion = getProtocolVersionFromLabel(liquidityUrlState.protocolVersion) ?? ProtocolVersion.V4

  // The header CTA sits above the pool browser, so it reads the browser's token selection off the
  // URL and carries it into the create form rather than opening it blank.
  const createPoolHref = useCreatePoolHrefFromSelection()

  const location = useLocation()
  const handleBack = useCallback(() => {
    // `from` marks an in-app entry (the create flow's "Add liquidity" CTA, the pool browser). Pop to it
    // rather than pushing a fresh URL, which would both lose where the user came from and let the form's
    // nuqs hooks rewrite the browse entry's filters away. No in-app history → fall back to the table.
    if (location.state && (location.state as { from?: string }).from) {
      navigate(-1)
    } else {
      navigate(ADD_LIQUIDITY_PATH)
    }
  }, [navigate, location.state])

  const browseSteps = useMemo(
    () => [
      { label: t('addLiquidity.selectPool'), active: true },
      { label: t('position.step.range'), active: false },
    ],
    [t],
  )

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
    return <Navigate to={ADD_LIQUIDITY_PATH} replace />
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
        <CreatePositionHeader
          leadingBreadcrumb={entryPointBreadcrumb}
          trailingBreadcrumb={<Text color="$neutral1">{t('common.createPosition')}</Text>}
          onBack={flowState === 'form' ? handleBack : undefined}
          title={flowState === 'form' ? t('addLiquidity.setYourPosition') : t('addLiquidity.choosePool')}
          actions={
            <Button
              fill={false}
              emphasis="text-only"
              icon={<Plus color="$neutral2" />}
              onPress={() => navigate(createPoolHref)}
            >
              <Button.Text color="$neutral2">{t('addLiquidity.createPool')}</Button.Text>
            </Button>
          }
        />

        {/* Two-column layout */}
        <Flex row gap="$spacing20" justifyContent="space-between" width="100%">
          {/* Left sidebar — hidden on mobile. The wrapper stretches to the full row height (no
              alignSelf) so the sticky card inside has room to stick; see FormWrapper for the same pattern. */}
          {!media.xl && (
            <Flex width={SIDEBAR_WIDTH}>
              {/* Offset by the table head's own top spacer so the card's top edge lines up with the
                  header row beside it, and both clear the app header. */}
              {flowState === 'browse' && (
                <PoolProgressIndicator steps={browseSteps} stickyTopOffset={STICKY_HEADER_TOP_GAP} />
              )}
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
                flowStep={flowStep ?? undefined}
                onLeavePool={handleBack}
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
      {/* The sticky step header (zIndexes.header) paints over anything overhanging into its box, and the
          toolbar's filter-count badge sits $spacing4 above its button — keep that much clearance under it. */}
      <Flex pt={media.xl ? '$spacing4' : undefined}>
        <PoolBrowser />
      </Flex>
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
  flowStep,
  onLeavePool,
}: {
  chainId: UniverseChainId
  poolData?: PoolData
  urlToken0?: Currency
  urlToken1?: Currency
  urlProtocolVersion: ProtocolVersion
  urlFee?: FeeData
  urlHook?: string
  flowStep?: PositionFlowStep
  // Where declining the pool's hook review sends the user: the same target as the header's back arrow.
  onLeavePool: () => void
}) {
  const protocolVersion = resolveSelectedProtocolVersion(poolData, urlProtocolVersion)

  // Entry points that already know the step (a pool browser row) put it in the URL. The create
  // flow's "Add liquidity" CTA deliberately doesn't, so derive it here from the loaded pool: v2
  // pairs skip straight to deposit, v3/v4 start on the range.
  const initialFlowStep =
    flowStep ??
    getNextFlowStep({
      currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
      protocolVersion,
      creatingPoolOrPair: false,
    })

  const { token0, token1 } = useMemo(() => {
    // Both seeds carry the pool's canonical on-chain tokens — WETH for a v2/v3 native pool, since
    // those pools are always WETH-denominated on-chain — and the pool-row / PDP links write that
    // same WETH address into `currencyA`/`currencyB`. Unwrap back to the native currency Explore
    // displayed so "ETH/USDC" doesn't land here as "WETH/USDC". The render guard lets the form
    // mount from URL tokens before `poolData` resolves, and `currencyInputs` is seeded once from
    // whichever arrives first, so the URL branch must unwrap too or the fix depends on a race.
    // No-op for v4 (already native) and for plain ERC20/ERC20 pools.
    const [rawToken0, rawToken1] = poolData
      ? [v2TokenToCurrency(poolData.token0), v2TokenToCurrency(poolData.token1)]
      : [urlToken0, urlToken1]
    return {
      token0:
        getCurrencyWithOptionalUnwrap({
          currency: rawToken0,
          shouldUnwrap: canUnwrapCurrency(rawToken0, protocolVersion),
        }) ?? undefined,
      token1:
        getCurrencyWithOptionalUnwrap({
          currency: rawToken1,
          shouldUnwrap: canUnwrapCurrency(rawToken1, protocolVersion),
        }) ?? undefined,
    }
  }, [poolData, protocolVersion, urlToken0, urlToken1])

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
            <SharedCreateModals onDeclineHookReview={onLeavePool} />
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
  useSeedPositionFromPool(poolData)

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
