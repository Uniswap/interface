/* oxlint-disable max-lines */

import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import {
  AllowedV4WethHookAddressesConfigKey,
  DynamicConfigs,
  FeatureFlags,
  useDynamicConfigValue,
  useFeatureFlag,
} from '@universe/gating'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import type { FlexProps } from 'ui/src'
import { Button, Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Search } from 'ui/src/components/icons/Search'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { LiquidityEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FeePoolSelectAction } from 'uniswap/src/features/telemetry/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { areCurrenciesEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ErrorCallout } from '~/components/ErrorCallout'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { MouseoverTooltip } from '~/components/Tooltip'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { AddHook } from '~/features/Liquidity/Create/AddHook'
import { AdvancedButton } from '~/features/Liquidity/Create/AdvancedButton'
import { CreatingPoolInfo, PoolAlreadyCreatedInfo } from '~/features/Liquidity/Create/CreatingPoolInfo'
import { useBlockedTokens } from '~/features/Liquidity/Create/hooks/useBlockedTokens'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { PoolParsingError } from '~/features/Liquidity/Create/PoolParsingError'
import { DEFAULT_FEE_DATA, DEFAULT_POSITION_STATE } from '~/features/Liquidity/Create/types'
import { CurrencySelector } from '~/features/Liquidity/CurrencySelector'
import { FeeTierSelector } from '~/features/Liquidity/FeeTierSelector'
import { HookModal } from '~/features/Liquidity/HookModal'
import { useAllFeeTierPoolData } from '~/features/Liquidity/hooks/useAllFeeTierPoolData'
import { useSelectedFeeBreakdown } from '~/features/Liquidity/hooks/useSelectedFeeBreakdown'
import { LpIncentivesAprDisplay } from '~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay'
import { getCreateFeeTierOptions, getSteeredRecommendedFee } from '~/features/Liquidity/utils/createFeeTiers'
import { getDefaultFeeTiersWithData, getFeeTierKey } from '~/features/Liquidity/utils/feeTiers'
import { hasLPFoTTransferError } from '~/features/Liquidity/utils/hasLPFoTTransferError'
import { isUnsupportedLPChain } from '~/features/Liquidity/utils/isUnsupportedLPChain'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { SUPPORTED_V2POOL_CHAIN_IDS } from '~/hooks/useNetworkSupportsV2'
import { buildPoolSearchParams } from '~/pages/AddLiquidity/poolLinkParams'
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
  const { loadingA, loadingB } = useLiquidityUrlState()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setSelectedChainId, setIsUserSelectedToken } = useMultichainContext()
  const trace = useTrace()
  const [hookModalOpen, setHookModalOpen] = useState(false)
  const [showWrappedNativeWarning, setShowWrappedNativeWarning] = useState(false)
  const isAddLiquidityRevamp = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)
  const isLpIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const isV4FeeDisplayEnabled = useFeatureFlag(FeatureFlags.V4ProtocolFeeDisplay)
  const isL2DefaultTickSpacingEnabled = useFeatureFlag(FeatureFlags.L2DefaultTickSpacing)
  const allowedV4WethHookAddresses: string[] = useDynamicConfigValue({
    config: DynamicConfigs.AllowedV4WethHookAddresses,
    key: AllowedV4WethHookAddressesConfigKey.HookAddresses,
    defaultValue: DEFAULT_ADDRESSES,
  })

  const {
    positionState: { hook, userApprovedHook, fee, migratingPosition },
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
  // Behind V4ProtocolFeeDisplay, each v4 default tier is either kept (its pool already holds >= $5k, so
  // users add to it) or swapped for the paired new, lower fee tier (labeled by effective rate). See
  // getCreateFeeTierOptions.
  const useNewDefaultFeeTiers = isV4FeeDisplayEnabled && protocolVersion === ProtocolVersion.V4
  // Newly created L2 tiers use 1x the fee tier (instead of 2x) when the flag is on; the util does the L2 check.
  const l2TickSpacingConfig = useMemo(
    () => ({ chainId: token0?.chainId, l2TickSpacingEnabled: isL2DefaultTickSpacingEnabled }),
    [token0?.chainId, isL2DefaultTickSpacingEnabled],
  )
  const [currencySearchInputState, setCurrencySearchInputState] = useState<'tokenA' | 'tokenB' | undefined>(undefined)
  const [isShowMoreFeeTiersEnabled, toggleShowMoreFeeTiersEnabled] = useReducer((state) => !state, false)

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
      const wrappedCurrencyNew = currency.isNative ? currency.wrapped : currency
      const wrappedCurrencyOther = otherCurrency?.isNative ? otherCurrency.wrapped : otherCurrency

      setSelectedChainId(currency.chainId)

      // If the tokens change, we want to reset the default fee tier (mostUsedFeeTier) in the useEffect below.
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

  const feeTierHasLpRewards = useMemo(
    () => Object.values(feeTierData).some((tier) => tier.boostedApr && tier.boostedApr > 0) && isLpIncentivesEnabled,
    [feeTierData, isLpIncentivesEnabled],
  )

  const mostUsedFeeTier = useMemo(() => {
    if (hasExistingFeeTiers && Object.keys(feeTierData).length > 0) {
      return Object.values(feeTierData).reduce((highest, current) => {
        return current.percentage.greaterThan(highest.percentage) ? current : highest
      })
    }

    return undefined
  }, [hasExistingFeeTiers, feeTierData])

  // Pre-select the most-used tier from existing pools; when there are none, select nothing. Behind
  // V4ProtocolFeeDisplay, steer a shallow canonical default to its paired new tier so the pre-selection
  // matches a rendered card. The revamped add-liquidity flow handles its own fee defaults. follow-up: LP-1074
  useEffect(() => {
    if (fee || isAddLiquidityRevamp || !mostUsedFeeTier) {
      return
    }

    const recommendedFee = useNewDefaultFeeTiers
      ? getSteeredRecommendedFee({ mostUsedFee: mostUsedFeeTier.fee, tvl: mostUsedFeeTier.tvl, l2TickSpacingConfig })
      : mostUsedFeeTier.fee
    setPositionState((prevState) => ({ ...prevState, fee: recommendedFee }))
    sendAnalyticsEvent(LiquidityEventName.SelectLiquidityPoolFeeTier, {
      action: FeePoolSelectAction.Recommended,
      fee_tier: recommendedFee.feeAmount,
      ...trace,
    })
  }, [mostUsedFeeTier, fee, setPositionState, trace, isAddLiquidityRevamp, useNewDefaultFeeTiers, l2TickSpacingConfig])

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
      const search = params.toString()
      navigate(search ? `${base}?${search}` : base)
      return
    }

    if (wrappedNativeWarning) {
      setShowWrappedNativeWarning(true)
      return
    }

    if (hook !== userApprovedHook) {
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

  const hasError = isUnsupportedTokenSelected || Boolean(fotErrorToken) || hasBlockedToken

  const currentFeeTierKey = useMemo(
    () =>
      fee
        ? getFeeTierKey({
            feeTier: fee.feeAmount,
            tickSpacing: fee.tickSpacing,
            isDynamicFee: fee.isDynamic,
          })
        : undefined,
    [fee],
  )

  const lpIncentiveRewardApr = useMemo(() => {
    if (!isLpIncentivesEnabled || protocolVersion !== ProtocolVersion.V4) {
      return undefined
    }

    // This component makes 2 API calls to ListPools -- one for current selected fee tier, and one to get all pools for all fee tiers
    // to ensure the current selected fee tier rewards APR matches the same fee tier in the fee tier selector,
    // grab the rewards tier from the fee tier directly
    const matchingFeeTier = Object.values(feeTierData).find(
      (tier) =>
        getFeeTierKey({
          feeTier: tier.fee.feeAmount,
          tickSpacing: tier.fee.tickSpacing,
          isDynamicFee: tier.fee.isDynamic,
        }) === currentFeeTierKey,
    )
    return matchingFeeTier?.boostedApr && matchingFeeTier.boostedApr > 0 ? matchingFeeTier.boostedApr : undefined
  }, [isLpIncentivesEnabled, protocolVersion, feeTierData, currentFeeTierKey])

  const poolAlreadyExists =
    isAddLiquidityRevamp &&
    !migratingPosition &&
    !creatingPoolOrPair &&
    !!poolOrPair &&
    !!poolId &&
    !!token0 &&
    !!token1 &&
    !!fee

  const defaultFeeTiers = getDefaultFeeTiersWithData({ chainId: token0?.chainId, feeTierData, protocolVersion })

  const feeTierOptions = useMemo(
    () =>
      getCreateFeeTierOptions({
        isFeeDisplayEnabled: isV4FeeDisplayEnabled,
        protocolVersion,
        defaultFeeTiers,
        feeTierData,
        hook,
        l2TickSpacingConfig,
      }),
    [isV4FeeDisplayEnabled, protocolVersion, defaultFeeTiers, feeTierData, hook, l2TickSpacingConfig],
  )

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
          onClearHook={() => setPositionState((state) => ({ ...state, hook: undefined, fee: undefined }))}
          onContinue={() => {
            setPositionState((state) => ({ ...state, userApprovedHook: hook }))
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
            <SelectStepError
              isUnsupportedTokenSelected={isUnsupportedTokenSelected}
              unsupportedChainId={unsupportedChainId}
              protocolVersion={protocolVersion}
              wrappedNativeWarning={undefined}
              fotToken={fotErrorToken}
              blockedTokenSymbols={blockedTokenSymbols}
            />
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
              isLpIncentivesEnabled={isLpIncentivesEnabled}
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
                        isDynamicFee: mostUsedFeeTier.fee.isDynamic,
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
                  {fee && lpIncentiveRewardApr && (
                    <LpIncentivesAprDisplay
                      lpIncentiveRewardApr={lpIncentiveRewardApr}
                      $md={{ display: 'none' }}
                      isSmall
                    />
                  )}
                </>
              }
              headerSubContent={
                lpIncentiveRewardApr ? (
                  <LpIncentivesAprDisplay
                    lpIncentiveRewardApr={lpIncentiveRewardApr}
                    display="none"
                    $md={{ display: 'flex' }}
                    isSmall
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
                !lpIncentiveRewardApr && feeTierHasLpRewards && !isShowMoreFeeTiersEnabled ? (
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
                      {t('pool.incentives.similarPoolHasRewards')}
                    </Text>
                    <Text
                      mt="$spacing2"
                      variant="body3"
                      color="$neutral1"
                      $sm={{ variant: 'body4', mt: '$spacing1' }}
                      {...ClickableTamaguiStyle}
                      onPress={toggleShowMoreFeeTiersEnabled}
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
          <Button
            size="large"
            key="SelectTokensStep-continue"
            onPress={handleOnContinue}
            loading={Boolean(poolOrPairLoading && token0 && token1 && fee)}
            disabled={
              !(creatingPoolOrPair || poolOrPair) || hasError || (showWrappedNativeWarning && !!wrappedNativeWarning)
            }
          >
            {poolAlreadyExists ? t('common.addLiquidity') : t('common.button.continue')}
          </Button>
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

function SelectStepError({
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
            ? t('position.create.unsupportedSolana.description')
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
          navigate('/positions/create/v2')
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
