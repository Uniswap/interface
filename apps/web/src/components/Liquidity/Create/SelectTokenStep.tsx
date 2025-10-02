import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import type { Currency, Percent } from '@uniswap/sdk-core'
import CreatingPoolInfo from 'components/CreatingPoolInfo/CreatingPoolInfo'
import { ErrorCallout } from 'components/ErrorCallout'
import { AddHook } from 'components/Liquidity/Create/AddHook'
import { AdvancedButton } from 'components/Liquidity/Create/AdvancedButton'
import { useLiquidityUrlState } from 'components/Liquidity/Create/hooks/useLiquidityUrlState'
import type { FeeData } from 'components/Liquidity/Create/types'
import { DEFAULT_POSITION_STATE } from 'components/Liquidity/Create/types'
import { HookModal } from 'components/Liquidity/HookModal'
import { useAllFeeTierPoolData } from 'components/Liquidity/hooks/useAllFeeTierPoolData'
import { getDefaultFeeTiersWithData, getFeeTierKey, isDynamicFeeTier } from 'components/Liquidity/utils/feeTiers'
import { hasLPFoTTransferError } from 'components/Liquidity/utils/hasLPFoTTransferError'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { LpIncentivesAprDisplay } from 'components/LpIncentives/LpIncentivesAprDisplay'
import { SwitchNetworkAction } from 'components/Popups/types'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { MouseoverTooltip } from 'components/Tooltip'
import { BIPS_BASE } from 'constants/misc'
import { SUPPORTED_V2POOL_CHAIN_IDS } from 'hooks/useNetworkSupportsV2'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { serializeSwapStateToURLParameters } from 'state/swap/hooks'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import type { FlexProps } from 'ui/src'
import { Button, DropdownButton, Flex, HeightAnimator, Shine, styled, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Search } from 'ui/src/components/icons/Search'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { AllowedV4WethHookAddressesConfigKey, DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useDynamicConfigValue, useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { LiquidityEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FeePoolSelectAction } from 'uniswap/src/features/telemetry/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { areCurrenciesEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { isV4UnsupportedChain } from 'utils/networkSupportsV4'

interface WrappedNativeWarning {
  wrappedToken: Currency
  nativeToken: Currency
  swapUrlParams: string
}

export const CurrencySelector = ({
  loading,
  currencyInfo,
  onPress,
}: {
  loading?: boolean
  currencyInfo: Maybe<CurrencyInfo>
  onPress: () => void
}) => {
  const { t } = useTranslation()
  const currency = currencyInfo?.currency

  return loading ? (
    <Shine width="100%">
      <Flex backgroundColor="$surface3" borderRadius="$rounded16" height={50} />
    </Shine>
  ) : (
    <DropdownButton
      emphasis={currencyInfo ? undefined : 'primary'}
      onPress={onPress}
      elementPositioning="grouped"
      isExpanded={false}
      icon={
        currency ? (
          <TokenLogo
            size={iconSizes.icon24}
            chainId={currency.chainId}
            name={currency.name}
            symbol={currency.symbol}
            url={currencyInfo.logoUrl}
          />
        ) : undefined
      }
    >
      <DropdownButton.Text color={currency ? '$neutral1' : '$surface1'}>
        {currency ? currency.symbol : t('fiatOnRamp.button.chooseToken')}
      </DropdownButton.Text>
    </DropdownButton>
  )
}

interface FeeTierData {
  value: FeeData
  title: string
  selectionPercent?: Percent
  tvl: string
  boostedApr?: number
}

const FeeTierContainer = styled(Flex, {
  flex: 1,
  width: '100%',
  p: '$spacing12',
  gap: '$spacing8',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  position: 'relative',
  ...ClickableTamaguiStyle,
})

function isUnsupportedLPChain(chainId: UniverseChainId | undefined, protocolVersion: ProtocolVersion): boolean {
  if (chainId && isSVMChain(chainId)) {
    return true
  }

  if (protocolVersion === ProtocolVersion.V2) {
    return Boolean(chainId && !SUPPORTED_V2POOL_CHAIN_IDS.includes(chainId))
  }

  if (protocolVersion === ProtocolVersion.V4) {
    return isV4UnsupportedChain(chainId)
  }

  return false
}

const FeeTier = ({
  feeTier,
  selected,
  onSelect,
  isLpIncentivesEnabled,
}: {
  feeTier: FeeTierData
  selected: boolean
  onSelect: (value: FeeData) => void
  isLpIncentivesEnabled?: boolean
}) => {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()

  return (
    <FeeTierContainer
      onPress={() => onSelect(feeTier.value)}
      background={selected ? '$surface3' : '$surface1'}
      justifyContent="space-between"
    >
      <Flex gap="$spacing8">
        <Flex row gap={10} justifyContent="space-between">
          <Text variant="buttonLabel3">
            {feeTier.value.isDynamic ? t('common.dynamic') : formatPercent(feeTier.value.feeAmount / BIPS_BASE, 4)}
          </Text>
          {selected && <CheckCircleFilled size="$icon.16" />}
        </Flex>
        <Text variant="body4">{feeTier.title}</Text>
      </Flex>
      <Flex mt="$spacing16" gap="$spacing2" alignItems="flex-end">
        <Flex row justifyContent="space-between" width="100%" alignItems="flex-end">
          <Flex>
            <Text variant="body4" color="$neutral2">
              {feeTier.tvl === '0'
                ? '0'
                : formatNumberOrString({ value: feeTier.tvl, type: NumberType.FiatTokenStats })}{' '}
              {t('common.totalValueLocked')}
            </Text>
            {feeTier.selectionPercent && feeTier.selectionPercent.greaterThan(0) && (
              <Text variant="body4" color="$neutral2">
                {t('fee.tier.percent.select', {
                  percentage: formatPercent(feeTier.selectionPercent.toSignificant(), 3),
                })}
              </Text>
            )}
          </Flex>
          {isLpIncentivesEnabled && feeTier.boostedApr !== undefined && feeTier.boostedApr > 0 && (
            <LpIncentivesAprDisplay lpIncentiveRewardApr={feeTier.boostedApr} isSmall />
          )}
        </Flex>
      </Flex>
    </FeeTierContainer>
  )
}

const DEFAULT_ADDRESSES: string[] = [] // this has to be a const to prevent a rerender loop

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
  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()
  const { setSelectedChainId } = useMultichainContext()
  const trace = useTrace()
  const [hookModalOpen, setHookModalOpen] = useState(false)
  const [showWrappedNativeWarning, setShowWrappedNativeWarning] = useState(false)
  const isLpIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const allowedV4WethHookAddresses: string[] = useDynamicConfigValue({
    config: DynamicConfigs.AllowedV4WethHookAddresses,
    key: AllowedV4WethHookAddressesConfigKey.HookAddresses,
    defaultValue: DEFAULT_ADDRESSES,
  })

  const {
    positionState: { hook, userApprovedHook, fee },
    setPositionState,
    protocolVersion,
    creatingPoolOrPair,
    currencies,
    poolOrPair,
    setFeeTierSearchModalOpen,
  } = useCreateLiquidityContext()

  const token0 = currencyInputs.tokenA
  const token1 = currencyInputs.tokenB
  const [currencySearchInputState, setCurrencySearchInputState] = useState<'tokenA' | 'tokenB' | undefined>(undefined)
  const [isShowMoreFeeTiersEnabled, toggleShowMoreFeeTiersEnabled] = useReducer((state) => !state, false)

  const isToken0Unsupported = isUnsupportedLPChain(token0?.chainId, protocolVersion)
  const isToken1Unsupported = isUnsupportedLPChain(token1?.chainId, protocolVersion)
  const unsupportedChainId = isToken0Unsupported ? token0?.chainId : isToken1Unsupported ? token1?.chainId : undefined
  const isUnsupportedTokenSelected = isToken0Unsupported || isToken1Unsupported

  const continueButtonEnabled = creatingPoolOrPair || poolOrPair

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
          // If the tokens change, we want to reset the default fee tier in the useEffect below.
          setDefaultFeeTierSelected(false)
          setCurrencyInputs((prevState) => ({
            ...prevState,
            [currencySearchInputState]: currency,
          }))
          break
        default:
          break
      }
    },
    [currencySearchInputState, setCurrencyInputs, currencyInputs, setSelectedChainId],
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

  const [defaultFeeTierSelected, setDefaultFeeTierSelected] = useState(false)
  const mostUsedFeeTier = useMemo(() => {
    if (hasExistingFeeTiers && Object.keys(feeTierData).length > 0) {
      return Object.values(feeTierData).reduce((highest, current) => {
        return current.percentage.greaterThan(highest.percentage) ? current : highest
      })
    }

    return undefined
  }, [hasExistingFeeTiers, feeTierData])

  // If the userApprovedHook changes, we want to reset the default fee tier in the useEffect below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: +userApprovedHook
  useEffect(() => {
    setDefaultFeeTierSelected(false)
  }, [userApprovedHook])

  useEffect(() => {
    // Don't auto-select recommended fee if user provided either legacy feeTier param or modern fee param
    const hasUserProvidedFee = parsedQs.feeTier || parsedQs.fee
    if (mostUsedFeeTier && !defaultFeeTierSelected && !hasUserProvidedFee) {
      setDefaultFeeTierSelected(true)
      setPositionState((prevState) => ({
        ...prevState,
        fee: mostUsedFeeTier.fee,
      }))
      sendAnalyticsEvent(LiquidityEventName.SelectLiquidityPoolFeeTier, {
        action: FeePoolSelectAction.Recommended,
        fee_tier: mostUsedFeeTier.fee.feeAmount,
        ...trace,
      })
    }
  }, [mostUsedFeeTier, defaultFeeTierSelected, parsedQs, setPositionState, trace])

  const { chains } = useEnabledChains({ platform: Platform.EVM })
  const supportedChains = useMemo(() => {
    return protocolVersion === ProtocolVersion.V4
      ? chains.filter((chain) => !isV4UnsupportedChain(chain))
      : protocolVersion === ProtocolVersion.V2
        ? chains.filter((chain) => SUPPORTED_V2POOL_CHAIN_IDS.includes(chain))
        : undefined
  }, [protocolVersion, chains])

  const handleOnContinue = () => {
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
  }, [token0, token1, protocolVersion, hook, allowedV4WethHookAddresses])

  const token0CurrencyInfo = useCurrencyInfo(currencyId(token0))
  const token1CurrencyInfo = useCurrencyInfo(currencyId(token1))

  const token0FoTError = hasLPFoTTransferError(token0CurrencyInfo, protocolVersion)
  const token1FoTError = hasLPFoTTransferError(token1CurrencyInfo, protocolVersion)
  const fotErrorToken = token0FoTError || token1FoTError

  const hasError = isUnsupportedTokenSelected || Boolean(fotErrorToken)

  const lpIncentiveRewardApr = useMemo(() => {
    if (!isLpIncentivesEnabled || protocolVersion !== ProtocolVersion.V4) {
      return undefined
    }

    // This component makes 2 API calls to ListPools -- one for current selected fee tier, and one to get all pools for all fee tiers
    // to ensure the current selected fee tier rewards APR matches the same fee tier in the fee tier selector,
    // grab the rewards tier from the fee tier directly
    const matchingFeeTier = Object.values(feeTierData).find(
      (tier) => getFeeTierKey(tier.fee.feeAmount, tier.fee.isDynamic) === getFeeTierKey(fee.feeAmount, fee.isDynamic),
    )
    return matchingFeeTier?.boostedApr && matchingFeeTier.boostedApr > 0 ? matchingFeeTier.boostedApr : undefined
  }, [isLpIncentivesEnabled, protocolVersion, feeTierData, fee.feeAmount, fee.isDynamic])

  const defaultFeeTiers = getDefaultFeeTiersWithData({ chainId: token0?.chainId, feeTierData, protocolVersion })

  return (
    <>
      {hook && (
        <HookModal
          isOpen={hookModalOpen}
          address={hook}
          onClose={() => setHookModalOpen(false)}
          onClearHook={() => setPositionState((state) => ({ ...state, hook: undefined }))}
          onContinue={() => {
            setPositionState((state) => ({ ...state, userApprovedHook: hook }))
            onContinue()
          }}
        />
      )}
      <PrefetchBalancesWrapper>
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
                      onPress={() => setCurrencySearchInputState('tokenA')}
                    />
                  </Flex>
                  <Flex row flex={1} flexBasis={0} $md={{ flexBasis: 'auto' }}>
                    <CurrencySelector
                      loading={loadingB}
                      currencyInfo={token1CurrencyInfo}
                      onPress={() => setCurrencySearchInputState('tokenB')}
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
              />
              {!hasError && protocolVersion === ProtocolVersion.V4 && <AddHook />}
            </Flex>
          </Flex>
          <Flex gap="$spacing24">
            <Flex>
              <Text variant="subheading1">
                <Trans i18nKey="fee.tier" />
              </Text>
              <Text variant="body3" color="$neutral2">
                {protocolVersion === ProtocolVersion.V2 ? t('fee.tier.description.v2') : t('fee.tier.description')}
              </Text>
            </Flex>

            {protocolVersion !== ProtocolVersion.V2 && (
              <Flex gap="$spacing8" pointerEvents={hasError ? 'none' : 'auto'} opacity={hasError ? 0.5 : 1}>
                <Flex borderRadius="$rounded12" borderWidth="$spacing1" borderColor="$surface3">
                  <Flex
                    row
                    gap="$spacing24"
                    justifyContent="space-between"
                    alignItems="center"
                    py="$spacing12"
                    px="$spacing16"
                  >
                    <Flex gap="$gap4" flex={1} minWidth={0}>
                      <Flex row gap="$gap8" alignItems="center">
                        <Text variant="subheading2" color="$neutral1">
                          {isDynamicFeeTier(fee) ? (
                            <Trans i18nKey="fee.tier.dynamic" />
                          ) : (
                            <Trans
                              i18nKey="fee.tierExact"
                              values={{ fee: formatPercent(fee.feeAmount / BIPS_BASE, 4) }}
                            />
                          )}
                        </Text>
                        {getFeeTierKey(fee.feeAmount, fee.isDynamic) ===
                        (mostUsedFeeTier &&
                          getFeeTierKey(mostUsedFeeTier.fee.feeAmount, mostUsedFeeTier.fee.isDynamic)) ? (
                          <MouseoverTooltip text={t('fee.tier.recommended.description')}>
                            <Flex
                              justifyContent="center"
                              borderRadius="$rounded6"
                              backgroundColor="$surface3"
                              px={7}
                              py={2}
                              $md={{ display: 'none' }}
                            >
                              <Text variant="buttonLabel4">
                                <Trans i18nKey="fee.tier.highestTvl" />
                              </Text>
                            </Flex>
                          </MouseoverTooltip>
                        ) : defaultFeeTiers.find(
                            (tier) =>
                              getFeeTierKey(tier.value.feeAmount, tier.value.isDynamic) ===
                              getFeeTierKey(fee.feeAmount, fee.isDynamic),
                          ) ? null : (
                          <Flex justifyContent="center" borderRadius="$rounded6" backgroundColor="$surface3" px={7}>
                            <Text variant="buttonLabel4">
                              <Trans i18nKey="fee.tier.new" />
                            </Text>
                          </Flex>
                        )}
                        {lpIncentiveRewardApr && (
                          <LpIncentivesAprDisplay
                            lpIncentiveRewardApr={lpIncentiveRewardApr}
                            $md={{ display: 'none' }}
                            isSmall
                          />
                        )}
                      </Flex>
                      <Text variant="body3" color="$neutral2">
                        <Trans i18nKey="fee.tier.label" />
                      </Text>
                      {lpIncentiveRewardApr && (
                        <LpIncentivesAprDisplay
                          lpIncentiveRewardApr={lpIncentiveRewardApr}
                          display="none"
                          $md={{ display: 'flex' }}
                          isSmall
                        />
                      )}
                    </Flex>
                    <Button
                      fill={false}
                      isDisabled={!currencyInputs.tokenA || !currencyInputs.tokenB}
                      size="xsmall"
                      maxWidth="fit-content"
                      emphasis="secondary"
                      onPress={toggleShowMoreFeeTiersEnabled}
                      $md={{ width: 32 }}
                      icon={
                        <RotatableChevron
                          direction={isShowMoreFeeTiersEnabled ? 'up' : 'down'}
                          width={iconSizes.icon20}
                          height={iconSizes.icon20}
                        />
                      }
                      iconPosition="after"
                    >
                      {isShowMoreFeeTiersEnabled ? t('common.less') : t('common.more')}
                    </Button>
                  </Flex>
                  {!lpIncentiveRewardApr && feeTierHasLpRewards && !isShowMoreFeeTiersEnabled && (
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
                  )}
                </Flex>
                <HeightAnimator open={isShowMoreFeeTiersEnabled}>
                  <Flex flexDirection="column" display="flex" gap="$gap12">
                    <Flex
                      $platform-web={{
                        display: 'grid',
                      }}
                      gridTemplateColumns={feeTierHasLpRewards ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'}
                      $md={{
                        gridTemplateColumns: feeTierHasLpRewards ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)',
                      }}
                      gap={10}
                    >
                      {defaultFeeTiers.map((feeTier) => (
                        <FeeTier
                          key={feeTier.value.feeAmount}
                          feeTier={feeTier}
                          selected={
                            getFeeTierKey(feeTier.value.feeAmount, feeTier.value.isDynamic) ===
                            getFeeTierKey(fee.feeAmount, fee.isDynamic)
                          }
                          onSelect={handleFeeTierSelect}
                          isLpIncentivesEnabled={isLpIncentivesEnabled}
                        />
                      ))}
                    </Flex>
                    {protocolVersion === ProtocolVersion.V4 && (
                      <AdvancedButton
                        title={t('fee.tier.search')}
                        Icon={Search}
                        onPress={() => {
                          setFeeTierSearchModalOpen(true)
                        }}
                      />
                    )}
                  </Flex>
                </HeightAnimator>
              </Flex>
            )}
          </Flex>
          <CreatingPoolInfo />
          <Flex row>
            <Button
              size="large"
              key="SelectTokensStep-continue"
              onPress={handleOnContinue}
              loading={Boolean(!continueButtonEnabled && token0 && token1)}
              isDisabled={!continueButtonEnabled || hasError || (showWrappedNativeWarning && !!wrappedNativeWarning)}
            >
              {t('common.button.continue')}
            </Button>
          </Flex>
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
        />
      </PrefetchBalancesWrapper>
    </>
  )
}

function SelectStepError({
  isUnsupportedTokenSelected,
  unsupportedChainId,
  protocolVersion,
  wrappedNativeWarning,
  fotToken,
}: {
  isUnsupportedTokenSelected: boolean
  unsupportedChainId?: UniverseChainId
  protocolVersion: ProtocolVersion
  wrappedNativeWarning?: WrappedNativeWarning
  fotToken?: CurrencyInfo
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setPositionState } = useCreateLiquidityContext()

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
        title={t('position.wrapped.warning', { nativeToken: wrappedNativeWarning.nativeToken.symbol })}
        description={t('position.wrapped.warning.info', {
          nativeToken: wrappedNativeWarning.nativeToken.symbol,
          wrappedToken: wrappedNativeWarning.wrappedToken.symbol,
        })}
        action={t('position.wrapped.unwrap', { wrappedToken: wrappedNativeWarning.wrappedToken.symbol })}
        onPress={() => navigate(`/swap${wrappedNativeWarning.swapUrlParams}`)}
      />
    )
  }

  if (fotToken) {
    return (
      <ErrorCallout
        errorMessage={true}
        title={t('token.safety.warning.fotLow.title')}
        description={t('position.fot.warning', { token: fotToken.currency.symbol })}
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
