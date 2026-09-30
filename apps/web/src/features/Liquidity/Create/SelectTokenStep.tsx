/* oxlint-disable max-lines */

import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId, Platform } from '@universe/chains'
import { AllowedV4WethHookAddressesConfigKey, DynamicConfigs, useDynamicConfigValue } from '@universe/gating'
import type { FlexCompatProps as FlexProps } from '@universe/mycelium'
import { Button, Flex, Text } from '@universe/mycelium'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Search } from 'ui/src/components/icons/Search'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { LiquidityEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FeePoolSelectAction } from 'uniswap/src/features/telemetry/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getWrappedTokenIfExists } from 'uniswap/src/utils/currency'
import { areCurrenciesEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ErrorCallout } from '~/components/ErrorCallout'
import { LPGeoRestrictionBanner } from '~/components/GeoRestriction/LPGeoRestrictionBanner'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { MouseoverTooltip } from '~/components/Tooltip'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { AddHook } from '~/features/Liquidity/Create/AddHook'
import { AdvancedButton } from '~/features/Liquidity/Create/AdvancedButton'
import { CreatingPoolInfo, PoolAlreadyCreatedInfo } from '~/features/Liquidity/Create/CreatingPoolInfo'
import { useBlockedTokens } from '~/features/Liquidity/Create/hooks/useBlockedTokens'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { useRecommendedHookPrefill } from '~/features/Liquidity/Create/hooks/useRecommendedPermissionedHook'
import { PoolParsingError } from '~/features/Liquidity/Create/PoolParsingError'
import { DEFAULT_FEE_DATA, DEFAULT_POSITION_STATE } from '~/features/Liquidity/Create/types'
import { CurrencySelector } from '~/features/Liquidity/CurrencySelector'
import { FeeTierSelector } from '~/features/Liquidity/FeeTierSelector'
import { HookModal } from '~/features/Liquidity/HookModal'
import { useAllFeeTierPoolData } from '~/features/Liquidity/hooks/useAllFeeTierPoolData'
import { useSelectedFeeBreakdown } from '~/features/Liquidity/hooks/useSelectedFeeBreakdown'
import { useHeadlineRewardSymbol } from '~/features/Liquidity/LPIncentives/hooks/useHeadlineRewardSymbol'
import { RewardAprBadge } from '~/features/Liquidity/LPIncentives/RewardAprBadge'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { getCreateFeeTierOptions, getCreateFeeTierSearchData } from '~/features/Liquidity/utils/createFeeTiers'
import { getDefaultFeeTiersWithData, getFeeTierKey } from '~/features/Liquidity/utils/feeTiers'
import { hasLPFoTTransferError } from '~/features/Liquidity/utils/hasLPFoTTransferError'
import { needsHookReview } from '~/features/Liquidity/utils/hookReview'
import { isUnsupportedLPChain } from '~/features/Liquidity/utils/isUnsupportedLPChain'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { PageType, useIsPage } from '~/hooks/useIsPage'
import { SUPPORTED_V2POOL_CHAIN_IDS } from '~/hooks/useNetworkSupportsV2'
import { buildPoolSearchParams, CREATE_POOL_PATH } from '~/pages/AddLiquidity/poolLinkParams'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { serializeSwapStateToURLParameters } from '~/pages/Swap/Swap/state/tradeQueryParams'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'
import { SwitchNetworkAction } from '~/state/popups/types'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { isV4UnsupportedChain } from '~/utils/networkSupportsV4'
import { getChainUrlParam } from '~/utils/params/chainParams'

interface WrappedNativeWarning {
  wrappedToken: Currency
  nativeToken: Currency
  swapUrlParams: string
}

const DEFAULT_ADDRESSES: string[] = [] // this has to be a const to prevent a rerender loop

// oxlint-disable-next-line complexity
export function SelectTokensStep({
  currencyInputs,
  setCurrencyInputs,
  onContinue,
  tokensLocked,
  ...rest
}: {
  tokensLocked?: boolean
  onContinue: () => void
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
} & FlexProps) {
  const { loadingA, loadingB, hook: urlHook } = useLiquidityUrlState()
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const navigate = useNavigate()
  const { pathname, search: currentSearch } = useLocation()
  const { setSelectedChainId, setIsUserSelectedToken } = useMultichainContext()
  const trace = useTrace()
  const [hookModalOpen, setHookModalOpen] = useState(false)
  const [showWrappedNativeWarning, setShowWrappedNativeWarning] = useState(false)
  const allowedV4WethHookAddresses: string[] = useDynamicConfigValue({
    config: DynamicConfigs.AllowedV4WethHookAddresses,
    key: AllowedV4WethHookAddressesConfigKey.HookAddresses,
    defaultValue: DEFAULT_ADDRESSES,
  })

  const {
    positionState,
    positionState: { hook, fee, migratingPosition },
    setPositionState,
    protocolVersion,
    creatingPoolOrPair,
    currencies,
    poolOrPairLoading,
    poolOrPair,
    poolId,
    protocolFee,
    setFeeTierSearchModalOpen,
  } = useCreateLiquidityContext()

  const token0 = currencyInputs.tokenA
  const token1 = currencyInputs.tokenB
  // Each v4 default tier is either kept (its pool already holds >= $5k, so users add to it) or swapped
  // for the paired new, lower fee tier (labeled by effective rate). See getCreateFeeTierOptions.
  const useNewDefaultFeeTiers = protocolVersion === ProtocolVersion.V4
  const [currencySearchInputState, setCurrencySearchInputState] = useState<'tokenA' | 'tokenB' | undefined>(undefined)
  // Fee tiers start expanded: nothing pre-selects a tier, so the user has to pick one here.
  const [isShowMoreFeeTiersEnabled, toggleShowMoreFeeTiersEnabled] = useReducer((state) => !state, true)

  const isToken0Unsupported = isUnsupportedLPChain(token0?.chainId, protocolVersion)
  const isToken1Unsupported = isUnsupportedLPChain(token1?.chainId, protocolVersion)
  const unsupportedChainId = isToken0Unsupported ? token0?.chainId : isToken1Unsupported ? token1?.chainId : undefined
  const isUnsupportedTokenSelected = isToken0Unsupported || isToken1Unsupported

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (currencySearchInputState === undefined) {
        return
      }

      const otherInputState = currencySearchInputState === 'tokenA' ? 'tokenB' : 'tokenA'
      const otherCurrency = currencyInputs[otherInputState]
      // On chains with no wrapped native (Arc, Tempo) there is no wrapped form to compare, so fall
      // back to the currency itself rather than letting two undefineds compare equal.
      const wrappedCurrencyNew = getWrappedTokenIfExists(currency) ?? currency
      const wrappedCurrencyOther = getWrappedTokenIfExists(otherCurrency) ?? otherCurrency

      setSelectedChainId(currency.chainId)

      // A tier only means something for the pair it was picked on.
      setPositionState((prevState) => ({ ...prevState, fee: undefined }))

      if (areCurrenciesEqual(currency, otherCurrency) || areCurrenciesEqual(wrappedCurrencyNew, wrappedCurrencyOther)) {
        setCurrencyInputs((prevState) => ({
          ...prevState,
          [otherInputState]: undefined,
          [currencySearchInputState]: currency,
        }))
        return
      }

      if (otherCurrency && otherCurrency.chainId !== currency.chainId) {
        setCurrencyInputs((prevState) => ({
          ...prevState,
          [otherInputState]: undefined,
          [currencySearchInputState]: currency,
        }))
        return
      }

      switch (currencySearchInputState) {
        case 'tokenA':
        case 'tokenB':
          setCurrencyInputs((prevState) => ({
            ...prevState,
            [currencySearchInputState]: currency,
          }))
          break
        default:
          break
      }
    },
    [currencySearchInputState, setCurrencyInputs, currencyInputs, setSelectedChainId, setPositionState],
  )

  const handleFeeTierSelect = useCallback(
    (feeData: FeeData) => {
      setPositionState((prevState) => ({ ...prevState, fee: feeData }))
      sendAnalyticsEvent(LiquidityEventName.SelectLiquidityPoolFeeTier, {
        action: FeePoolSelectAction.Manual,
        fee_tier: feeData.feeAmount,
        ...trace,
      })
    },
    [setPositionState, trace],
  )

  const { feeTierData, hasExistingFeeTiers } = useAllFeeTierPoolData({
    chainId: token0?.chainId,
    protocolVersion,
    sdkCurrencies: currencies.sdk,
    hook: hook ?? ZERO_ADDRESS,
  })

  // The tiers a user can actually reach — the same collapse + URL-pin as the "Select fee tier" list. Basing
  // the rewards banner on this (not raw feeTierData) hides it when a pin strands the incentivized pool, which
  // is then unreachable on both surfaces — otherwise we'd advertise a rewarded pool the user can't switch to.
  const reachableFeeTiers = useMemo(
    () => getCreateFeeTierSearchData({ useNewDefaultFeeTiers, feeTierData, formatPercent, hook, selectedFee: fee }),
    [useNewDefaultFeeTiers, feeTierData, formatPercent, hook, fee],
  )

  // The best-boosted reachable tier: the pool the "switch pools" banner advertises, and the source of
  // the reward token that names it. Reachable rather than rendered — the banner covers tiers no box
  // shows, which is why it can't reuse `bestBoostedFeeTier`.
  const bestBoostedReachableTier = useMemo(
    () =>
      reachableFeeTiers
        .filter((tier) => (tier.boostedApr ?? 0) > 0)
        .sort((a, b) => (b.boostedApr ?? 0) - (a.boostedApr ?? 0))
        .at(0),
    [reachableFeeTiers],
  )
  const feeTierHasLpRewards = bestBoostedReachableTier !== undefined
  const bannerRewardSymbol = useHeadlineRewardSymbol(bestBoostedReachableTier?.rewards)

  const mostUsedFeeTier = useMemo(() => {
    if (hasExistingFeeTiers && Object.keys(feeTierData).length > 0) {
      return Object.values(feeTierData).reduce((highest, current) => {
        return current.percentage.greaterThan(highest.percentage) ? current : highest
      })
    }

    return undefined
  }, [hasExistingFeeTiers, feeTierData])

  // Auto-suggest the recommended hook for permissioned pairs (ECO-577). No-op unless the pair is
  // permissioned.
  useRecommendedHookPrefill({
    tokenA: currencyInputs.tokenA,
    tokenB: currencyInputs.tokenB,
    protocolVersion,
    hook,
    urlHook,
    setPositionState,
  })

  const { chains } = useEnabledChains({ platform: Platform.EVM })
  const supportedChains = useMemo(() => {
    return protocolVersion === ProtocolVersion.V4
      ? chains.filter((chain) => !isV4UnsupportedChain(chain))
      : protocolVersion === ProtocolVersion.V2
        ? chains.filter((chain) => SUPPORTED_V2POOL_CHAIN_IDS.includes(chain))
        : undefined
  }, [protocolVersion, chains])

  const handleOpenTokenSelector = useCallback(
    (inputState: 'tokenA' | 'tokenB') => {
      const otherToken = inputState === 'tokenA' ? token1 : token0
      if (otherToken?.chainId) {
        setSelectedChainId(otherToken.chainId)
        setIsUserSelectedToken(true)
      }
      setCurrencySearchInputState(inputState)
    },
    [token0, token1, setSelectedChainId, setIsUserSelectedToken],
  )

  const handleOnContinue = () => {
    if (poolAlreadyExists && poolId && token0.chainId) {
      const base = `/positions/add/${getChainUrlParam(token0.chainId)}/${poolId}`
      const params = buildPoolSearchParams({
        currencyA: token0.isNative ? NATIVE_CHAIN_ID : token0.address,
        currencyB: token1.isNative ? NATIVE_CHAIN_ID : token1.address,
        chain: getChainUrlParam(token0.chainId),
        fee,
        hookAddress: hook,
        protocolVersion: getProtocolVersionLabel(protocolVersion),
      })
      // Deliberately no `step`: the destination derives its first form step from the pool it loads.
      // Writing one here would land in the URL while this page is still mounted, animating it into
      // the range step — a visible double-render — before the route swaps.
      // Also no hook review before the hop: the destination's HookReviewGate runs it on entry, which
      // covers pool-browser rows and PDP links that never pass through this step.
      const search = params.toString()
      // `from` marks this as an in-app entry so the destination's back arrow pops here instead of
      // falling through to the pool browser.
      navigate(search ? `${base}?${search}` : base, { state: { from: `${pathname}${currentSearch}` } })
      return
    }

    if (wrappedNativeWarning) {
      setShowWrappedNativeWarning(true)
      return
    }

    if (needsHookReview(positionState)) {
      setHookModalOpen(true)
    } else {
      onContinue()
    }
  }

  const wrappedNativeWarning = useMemo((): WrappedNativeWarning | undefined => {
    if (protocolVersion !== ProtocolVersion.V4) {
      setShowWrappedNativeWarning(false)
      return undefined
    }

    // Only enforce native ETH on pool creation; allow WETH when adding liquidity to an existing pool.
    if (!creatingPoolOrPair) {
      return undefined
    }

    if (hook && allowedV4WethHookAddresses.includes(hook)) {
      return undefined
    }

    const wethToken0 = token0 && WRAPPED_NATIVE_CURRENCY[token0.chainId]
    if (token0 && wethToken0?.equals(token0)) {
      const nativeToken = nativeOnChain(token0.chainId)
      return {
        wrappedToken: token0,
        nativeToken,
        swapUrlParams: serializeSwapStateToURLParameters({
          chainId: token0.chainId,
          inputCurrency: token0,
          outputCurrency: nativeToken,
        }),
      }
    }

    const wethToken1 = token1 && WRAPPED_NATIVE_CURRENCY[token1.chainId]
    if (token1 && wethToken1?.equals(token1)) {
      const nativeToken = nativeOnChain(token1.chainId)
      return {
        wrappedToken: token1,
        nativeToken,
        swapUrlParams: serializeSwapStateToURLParameters({
          chainId: token1.chainId,
          inputCurrency: token1,
          outputCurrency: nativeToken,
        }),
      }
    }

    setShowWrappedNativeWarning(false)
    return undefined
  }, [token0, token1, protocolVersion, hook, allowedV4WethHookAddresses, creatingPoolOrPair])

  const token0CurrencyInfo = useCurrencyInfo(currencyId(token0))
  const token1CurrencyInfo = useCurrencyInfo(currencyId(token1))

  const token0FoTError = hasLPFoTTransferError(token0CurrencyInfo, protocolVersion)
  const token1FoTError = hasLPFoTTransferError(token1CurrencyInfo, protocolVersion)
  const fotErrorToken = token0FoTError || token1FoTError

  const { hasBlockedToken, blockedTokenSymbols } = useBlockedTokens(token0, token1)

  const { isGeoRestricted, restrictedTokenSymbol, unavailableLabel } = useLPGeoRestriction({
    token0,
    token1,
  })

  const hasError = isUnsupportedTokenSelected || Boolean(fotErrorToken) || hasBlockedToken || isGeoRestricted

  const currentFeeTierKey = useMemo(
    () => (fee ? getFeeTierKey({ feeTier: fee.feeAmount, tickSpacing: fee.tickSpacing }) : undefined),
    [fee],
  )

  // The selected tier's served per-token boosts; empty when it runs no live campaign.
  const selectedTierRewards = useMemo(() => {
    if (protocolVersion !== ProtocolVersion.V4) {
      return []
    }

    // This component makes 2 API calls to ListPools -- one for current selected fee tier, and one to get all pools for all fee tiers
    // to ensure the current selected fee tier rewards APR matches the same fee tier in the fee tier selector,
    // grab the rewards tier from the fee tier directly
    const matchingFeeTier = Object.values(feeTierData).find(
      (tier) => getFeeTierKey({ feeTier: tier.fee.feeAmount, tickSpacing: tier.fee.tickSpacing }) === currentFeeTierKey,
    )
    return matchingFeeTier?.rewards ?? []
  }, [protocolVersion, feeTierData, currentFeeTierKey])

  const selectedTierIsBoosted = selectedTierRewards.length > 0

  const poolAlreadyExists =
    !migratingPosition && !creatingPoolOrPair && !!poolOrPair && !!poolId && !!token0 && !!token1 && !!fee

  const defaultFeeTiers = useMemo(
    () => getDefaultFeeTiersWithData({ chainId: token0?.chainId, feeTierData, protocolVersion }),
    [token0?.chainId, feeTierData, protocolVersion],
  )

  const feeTierOptions = useMemo(
    () =>
      getCreateFeeTierOptions({
        protocolVersion,
        defaultFeeTiers,
        feeTierData,
        hook,
        selectedFee: fee,
      }),
    [protocolVersion, defaultFeeTiers, feeTierData, hook, fee],
  )

  // The best-rewarded tier among the rendered boxes — what "Switch pools" selects. Undefined when the
  // rewarded pool sits at a fee amount no box covers (the banner reads raw feeTierData, which is wider).
  const bestBoostedFeeTier = useMemo(
    () =>
      feeTierOptions
        .filter((tier) => tier.boostedApr)
        .sort((a, b) => (b.boostedApr ?? 0) - (a.boostedApr ?? 0))
        .at(0),
    [feeTierOptions],
  )

  const handleSwitchToBoostedPool = useCallback(() => {
    if (bestBoostedFeeTier) {
      handleFeeTierSelect(bestBoostedFeeTier.value)
      return
    }
    // No box covers the rewarded tier, so expanding wouldn't reveal it — search is the only way in.
    if (protocolVersion === ProtocolVersion.V4) {
      setFeeTierSearchModalOpen(true)
      return
    }
    toggleShowMoreFeeTiersEnabled()
  }, [bestBoostedFeeTier, handleFeeTierSelect, protocolVersion, setFeeTierSearchModalOpen])

  // Breakdown for the fee shown in the selector header (the collapsed "0.25% fee tier" summary), so it
  // gets the same LP fee + hover tooltip as the tier boxes.
  const selectedFeeBreakdown = useSelectedFeeBreakdown({ protocolVersion, fee, servedProtocolFee: protocolFee, hook })

  return (
    <>
      {hook && (
        <HookModal
          isOpen={hookModalOpen}
          address={hook}
          onClose={() => setHookModalOpen(false)}
          onCancel={() => {
            setPositionState((state) => ({ ...state, hook: undefined, fee: undefined }))
            setHookModalOpen(false)
          }}
          onContinue={() => {
            setPositionState((state) => ({ ...state, userApprovedHook: hook }))
            setHookModalOpen(false)
            onContinue()
          }}
        />
      )}
      <Flex gap="$spacing32" {...rest}>
        <Flex gap="$spacing16">
          <Flex gap="$spacing12">
            <Flex>
              <Text variant="subheading1">{tokensLocked ? t('pool.tokenPair') : t('pool.selectPair')}</Text>
              <Text variant="body3" color="$neutral2">
                {tokensLocked ? t('position.migrate.liquidity') : t('position.provide.liquidity')}
              </Text>
            </Flex>
            {tokensLocked && token0 && token1 ? (
              <Flex row gap="$gap16" py="$spacing4" alignItems="center">
                <DoubleCurrencyLogo currencies={[token0, token1]} size={44} />
                <Flex grow>
                  <Text variant="heading3">
                    {token0.symbol} / {token1.symbol}
                  </Text>
                </Flex>
              </Flex>
            ) : (
              <Flex row gap="$gap16" $md={{ flexDirection: 'column' }}>
                <Flex row flex={1} flexBasis={0} $md={{ flexBasis: 'auto' }}>
                  <CurrencySelector
                    loading={loadingA}
                    currencyInfo={token0CurrencyInfo}
                    onPress={() => handleOpenTokenSelector('tokenA')}
                  />
                </Flex>
                <Flex row flex={1} flexBasis={0} $md={{ flexBasis: 'auto' }}>
                  <CurrencySelector
                    loading={loadingB}
                    currencyInfo={token1CurrencyInfo}
                    onPress={() => handleOpenTokenSelector('tokenB')}
                  />
                </Flex>
              </Flex>
            )}
            {/* The geo block has no remedy, so it replaces the other callouts rather than stacking with them. */}
            {isGeoRestricted ? (
              <LPGeoRestrictionBanner tokenSymbol={restrictedTokenSymbol} />
            ) : (
              <SelectStepError
                isUnsupportedTokenSelected={isUnsupportedTokenSelected}
                unsupportedChainId={unsupportedChainId}
                protocolVersion={protocolVersion}
                wrappedNativeWarning={undefined}
                fotToken={fotErrorToken}
                blockedTokenSymbols={blockedTokenSymbols}
              />
            )}
            {!hasError && protocolVersion === ProtocolVersion.V4 && <AddHook />}
          </Flex>
        </Flex>
        <Flex gap="$spacing24">
          <Flex>
            <Text variant="subheading1">{t('fee.tier')}</Text>
            <Text variant="body3" color="$neutral2">
              {protocolVersion === ProtocolVersion.V2 ? t('fee.tier.description.v2') : t('fee.tier.description')}
            </Text>
          </Flex>

          {protocolVersion === ProtocolVersion.V2 ? (
            // V2 pairs always have a fixed 0.3% fee, so show it without the option to change it
            <FeeTierSelector
              selectedFee={DEFAULT_FEE_DATA}
              onFeeSelect={handleFeeTierSelect}
              feeTiers={[]}
              readOnly
              selectedFeeBreakdown={selectedFeeBreakdown}
            />
          ) : (
            <FeeTierSelector
              selectedFee={fee}
              onFeeSelect={handleFeeTierSelect}
              feeTiers={feeTierOptions}
              selectedFeeBreakdown={selectedFeeBreakdown}
              disabled={
                hasError || !currencyInputs.tokenA || !currencyInputs.tokenB || Boolean(migratingPosition?.isOutOfRange)
              }
              hasLpRewards={feeTierHasLpRewards}
              allowDynamicFee={!!hook}
              isExpanded={isShowMoreFeeTiersEnabled}
              onToggleExpand={toggleShowMoreFeeTiersEnabled}
              headerInlineContent={
                <>
                  {fee &&
                  currentFeeTierKey ===
                    (mostUsedFeeTier &&
                      getFeeTierKey({
                        feeTier: mostUsedFeeTier.fee.feeAmount,
                        tickSpacing: mostUsedFeeTier.fee.tickSpacing,
                      })) ? (
                    <MouseoverTooltip text={t('fee.tier.recommended.description')}>
                      <Flex
                        justifyContent="center"
                        borderRadius="$rounded6"
                        backgroundColor="$surface3"
                        px={7}
                        py="$spacing2"
                        $md={{ display: 'none' }}
                      >
                        <Text variant="buttonLabel4">{t('fee.tier.highestTvl')}</Text>
                      </Flex>
                    </MouseoverTooltip>
                  ) : currentFeeTierKey && !feeTierData[currentFeeTierKey]?.created ? (
                    <Flex justifyContent="center" borderRadius="$rounded6" backgroundColor="$surface3" px={7}>
                      <Text variant="buttonLabel4">{t('fee.tier.new')}</Text>
                    </Flex>
                  ) : null}
                  {fee && selectedTierIsBoosted && (
                    <RewardAprBadge
                      rewards={selectedTierRewards}
                      $md={{ display: 'none' }}
                      size="sm"
                      label="rewardApr"
                    />
                  )}
                </>
              }
              headerSubContent={
                selectedTierIsBoosted ? (
                  <RewardAprBadge
                    rewards={selectedTierRewards}
                    display="none"
                    $md={{ display: 'flex' }}
                    size="sm"
                    label="rewardApr"
                  />
                ) : undefined
              }
              expandedFooterContent={
                protocolVersion === ProtocolVersion.V4 ? (
                  <AdvancedButton
                    title={t('fee.tier.search')}
                    Icon={Search}
                    onPress={() => {
                      setFeeTierSearchModalOpen(true)
                    }}
                  />
                ) : undefined
              }
              footerContent={
                // Selecting the rewarded tier boosts the selected tier, which retires the banner. A manual
                // expand only retires it once a box actually shows the reward APR — otherwise the banner is
                // still the only route to the pool ("Switch pools" falls back to fee tier search).
                // No banner without a symbol to name: the copy is a sentence built around the token.
                !selectedTierIsBoosted && bannerRewardSymbol && !(isShowMoreFeeTiersEnabled && bestBoostedFeeTier) ? (
                  <Flex
                    row
                    alignItems="center"
                    gap="$spacing12"
                    mt="$spacing4"
                    p="$spacing12"
                    $sm={{ p: '$spacing6', gap: '$spacing6' }}
                    backgroundColor="$accent2"
                    borderBottomLeftRadius="$rounded12"
                    borderBottomRightRadius="$rounded12"
                    width="100%"
                  >
                    <InfoCircleFilled color="$accent1" size="$icon.16" />
                    <Text variant="body3" color="$accent1" mt="$spacing2" $sm={{ variant: 'body4', mt: '$spacing1' }}>
                      {t('pool.incentives.similarPoolHasTokenRewards', { symbol: bannerRewardSymbol })}
                    </Text>
                    <Text
                      mt="$spacing2"
                      variant="body3"
                      color="$neutral1"
                      $sm={{ variant: 'body4', mt: '$spacing1' }}
                      {...ClickableTamaguiStyle}
                      onPress={handleSwitchToBoostedPool}
                    >
                      {t('pool.incentives.switchPools')}
                    </Text>
                  </Flex>
                ) : undefined
              }
            />
          )}
        </Flex>
        {poolAlreadyExists ? <PoolAlreadyCreatedInfo /> : <CreatingPoolInfo />}
        <Flex row>
          {isGeoRestricted ? (
            <Button size="large" key="SelectTokensStep-geoRestricted" disabled>
              {unavailableLabel}
            </Button>
          ) : (
            <Button
              size="large"
              key="SelectTokensStep-continue"
              onPress={handleOnContinue}
              loading={Boolean(poolOrPairLoading && token0 && token1 && fee)}
              disabled={
                !(creatingPoolOrPair || poolOrPair) || hasError || (showWrappedNativeWarning && !!wrappedNativeWarning)
              }
            >
              {t('common.button.continue')}
            </Button>
          )}
        </Flex>
        <PoolParsingError formComplete={Boolean(token0 && token1 && fee)} />
        {showWrappedNativeWarning && wrappedNativeWarning && (
          <SelectStepError
            isUnsupportedTokenSelected={false}
            protocolVersion={protocolVersion}
            wrappedNativeWarning={wrappedNativeWarning}
            fotToken={undefined}
          />
        )}
      </Flex>

      <CurrencySearchModal
        isOpen={currencySearchInputState !== undefined}
        onDismiss={() => setCurrencySearchInputState(undefined)}
        switchNetworkAction={SwitchNetworkAction.LP}
        onCurrencySelect={handleCurrencySelect}
        chainIds={supportedChains}
        flow={TokenSelectorFlow.Liquidity}
      />
    </>
  )
}

/** @internal - Only exported for testing */
export function SelectStepError({
  isUnsupportedTokenSelected,
  unsupportedChainId,
  protocolVersion,
  wrappedNativeWarning,
  fotToken,
  blockedTokenSymbols,
}: {
  isUnsupportedTokenSelected: boolean
  unsupportedChainId?: UniverseChainId
  protocolVersion: ProtocolVersion
  wrappedNativeWarning?: WrappedNativeWarning
  fotToken?: CurrencyInfo
  blockedTokenSymbols?: string[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setPositionState } = useCreateLiquidityContext()
  const isCreatePoolLeg = useIsPage(PageType.ADD_LIQUIDITY_NEW)
  const { evmAddress, svmAddress } = useActiveAddresses()
  // Dual-VM wallets can stay connected — the user just needs to pick an EVM token instead.
  const isDualVMWallet = Boolean(evmAddress && svmAddress)

  if (blockedTokenSymbols && blockedTokenSymbols.length > 0) {
    return (
      <ErrorCallout
        errorMessage={true}
        title={
          blockedTokenSymbols.length > 1
            ? t('token.safety.blocked.title.tokensNotAvailable', {
                tokenSymbol0: blockedTokenSymbols[0],
                tokenSymbol1: blockedTokenSymbols[1],
              })
            : t('token.safety.blocked.title.tokenNotAvailable', { tokenSymbol: blockedTokenSymbols[0] })
        }
        description={
          <>
            {blockedTokenSymbols.length > 1
              ? t('token.safety.warning.blocked.description.default_other')
              : t('token.safety.warning.blocked.description.default_one')}{' '}
            <Text
              color="$neutral1"
              variant="body3"
              onPress={() => window.open(UniswapHelpUrls.articles.tokenWarning, '_blank', 'noopener,noreferrer')}
              {...ClickableTamaguiStyle}
            >
              {t('common.button.learn')}
            </Text>
          </>
        }
      />
    )
  }

  if (isUnsupportedTokenSelected) {
    return (
      <ErrorCallout
        errorMessage={true}
        title={
          unsupportedChainId === UniverseChainId.Solana
            ? t('position.create.unsupportedSolana')
            : protocolVersion === ProtocolVersion.V2
              ? t('position.create.v2unsupportedChain')
              : t('position.migrate.v4unsupportedChain')
        }
        description={
          unsupportedChainId === UniverseChainId.Solana
            ? isDualVMWallet
              ? t('position.create.unsupportedSolana.description.dualVM')
              : t('position.create.unsupportedSolana.description')
            : t('position.create.unsupportedToken.description')
        }
      />
    )
  }

  if (wrappedNativeWarning) {
    return (
      <ErrorCallout
        isWarning
        errorMessage={true}
        title={t('position.wrapped.warning', {
          nativeToken: wrappedNativeWarning.nativeToken.symbol ?? t('common.token'),
        })}
        description={t('position.wrapped.warning.info', {
          nativeToken: wrappedNativeWarning.nativeToken.symbol ?? t('common.token'),
          wrappedToken: wrappedNativeWarning.wrappedToken.symbol ?? t('common.token'),
        })}
        action={t('position.wrapped.unwrap', {
          wrappedToken: wrappedNativeWarning.wrappedToken.symbol ?? t('common.token'),
        })}
        onPress={() => navigate(`/swap${wrappedNativeWarning.swapUrlParams}`)}
      />
    )
  }

  if (fotToken) {
    return (
      <ErrorCallout
        errorMessage={true}
        title={t('token.safety.warning.fotLow.title')}
        description={t('position.fot.warning', { token: fotToken.currency.symbol ?? t('common.token') })}
        action={t('position.fot.warning.cta')}
        onPress={() => {
          // Off the create leg there is no v2 form to switch into: migration hides the deposit step,
          // and an existing v2 pair skips straight to it, so switching in place strands the user with
          // nothing rendered. Those callers start a fresh v2 create instead, carrying the version in
          // the param the create leg reads it from.
          if (!isCreatePoolLeg) {
            navigate(`${CREATE_POOL_PATH}?protocolVersion=v2`)
          }
          setPositionState({
            ...DEFAULT_POSITION_STATE,
            protocolVersion: ProtocolVersion.V2,
          })
        }}
      />
    )
  }

  return null
}
