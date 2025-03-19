import { FeePoolSelectAction, LiquidityEventName } from '@uniswap/analytics-events'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Percent } from '@uniswap/sdk-core'
import CreatingPoolInfo from 'components/CreatingPoolInfo/CreatingPoolInfo'
import { ErrorCallout } from 'components/ErrorCallout'
import { HookModal } from 'components/Liquidity/HookModal'
import { useAllFeeTierPoolData } from 'components/Liquidity/hooks'
import { getDefaultFeeTiersWithData, hasLPFoTTransferError, isDynamicFeeTier } from 'components/Liquidity/utils'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { MouseoverTooltip } from 'components/Tooltip'
import { ZERO_ADDRESS } from 'constants/misc'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { SUPPORTED_V2POOL_CHAIN_IDS } from 'hooks/useNetworkSupportsV2'
import { AddHook } from 'pages/Pool/Positions/create/AddHook'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { AdvancedButton, Container } from 'pages/Pool/Positions/create/shared'
import { DEFAULT_POSITION_STATE, FeeData } from 'pages/Pool/Positions/create/types'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { serializeSwapStateToURLParameters } from 'state/swap/hooks'
import { TamaguiClickableStyle } from 'theme/components'
import { PositionField } from 'types/position'
import { DeprecatedButton } from 'ui'
import { Button, Flex, FlexProps, HeightAnimator, Text, styled } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Search } from 'ui/src/components/icons/Search'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { WRAPPED_NATIVE_CURRENCY, nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { areCurrenciesEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useFormatter } from 'utils/formatNumbers'
import { isV4UnsupportedChain } from 'utils/networkSupportsV4'

interface WrappedNativeWarning {
  wrappedToken: Currency
  nativeToken: Currency
  swapUrlParams: string
}

export const CurrencySelector = ({
  currencyInfo,
  onPress,
}: {
  currencyInfo: Maybe<CurrencyInfo>
  onPress: () => void
}) => {
  const { t } = useTranslation()
  const currency = currencyInfo?.currency

  // TODO: [Button] blocked by (WALL-5674)
  return (
    <DeprecatedButton
      flex={1}
      width="100%"
      onPress={onPress}
      py="$spacing12"
      pr="$spacing12"
      pl="$spacing16"
      theme="primary"
      backgroundColor={currency ? '$surface3' : '$accent3'}
      justifyContent="space-between"
      gap="$spacing8"
      hoverStyle={{
        backgroundColor: undefined,
        opacity: 0.8,
      }}
      pressStyle={{
        backgroundColor: undefined,
      }}
    >
      <Flex row gap="$spacing8" alignItems="center">
        {currency && (
          <TokenLogo
            size={iconSizes.icon24}
            chainId={currency.chainId}
            name={currency.name}
            symbol={currency.symbol}
            url={currencyInfo?.logoUrl}
          />
        )}
        <Text variant="buttonLabel2" color={currency ? '$neutral1' : '$surface1'}>
          {currency ? currency.symbol : t('fiatOnRamp.button.chooseToken')}
        </Text>
      </Flex>
      <RotatableChevron direction="down" color="$neutral2" width={iconSizes.icon24} height={iconSizes.icon24} />
    </DeprecatedButton>
  )
}

interface FeeTier {
  value: FeeData
  title: string
  selectionPercent?: Percent
  tvl: string
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
  ...TamaguiClickableStyle,
})

const FeeTier = ({
  feeTier,
  selected,
  onSelect,
}: {
  feeTier: FeeTier
  selected: boolean
  onSelect: (value: FeeData) => void
}) => {
  const { t } = useTranslation()
  const { formatPercent } = useFormatter()
  const { formatNumberOrString } = useLocalizationContext()

  return (
    <FeeTierContainer
      onPress={() => onSelect(feeTier.value)}
      background={selected ? '$surface3' : '$surface1'}
      justifyContent="space-between"
    >
      <Flex gap="$spacing8">
        <Flex row gap={10} justifyContent="space-between">
          <Text variant="buttonLabel3">{formatPercent(new Percent(feeTier.value.feeAmount, 1000000))}</Text>
          {selected && <CheckCircleFilled size={iconSizes.icon16} />}
        </Flex>
        <Text variant="body4">{feeTier.title}</Text>
      </Flex>
      <Flex gap="$spacing2">
        <Text variant="body4" color="$neutral2">
          {feeTier.tvl === '0' ? '0' : formatNumberOrString({ value: feeTier.tvl, type: NumberType.FiatTokenStats })}{' '}
          {t('common.totalValueLocked')}
        </Text>
        {feeTier.selectionPercent && feeTier.selectionPercent.greaterThan(0) && (
          <Text variant="body4" color="$neutral2">
            {formatPercent(feeTier.selectionPercent)} select
          </Text>
        )}
      </Flex>
    </FeeTierContainer>
  )
}

export function SelectTokensStep({
  onContinue,
  tokensLocked,
  ...rest
}: { tokensLocked?: boolean; onContinue: () => void } & FlexProps) {
  const { formatPercent } = useFormatter()
  const { t } = useTranslation()
  const { setSelectedChainId } = useMultichainContext()
  const trace = useTrace()
  const [hookModalOpen, setHookModalOpen] = useState(false)

  const {
    positionState: { hook, userApprovedHook, currencyInputs, fee, protocolVersion },
    setPositionState,
    derivedPositionInfo,
    setFeeTierSearchModalOpen,
  } = useCreatePositionContext()

  const [token0, token1] = derivedPositionInfo.currencies
  const [currencySearchInputState, setCurrencySearchInputState] = useState<PositionField | undefined>(undefined)
  const [isShowMoreFeeTiersEnabled, toggleShowMoreFeeTiersEnabled] = useReducer((state) => !state, false)
  const isV4UnsupportedTokenSelected =
    protocolVersion === ProtocolVersion.V4 &&
    (isV4UnsupportedChain(token0?.chainId) || isV4UnsupportedChain(token1?.chainId))
  const continueButtonEnabled =
    derivedPositionInfo.creatingPoolOrPair ||
    (derivedPositionInfo.protocolVersion === ProtocolVersion.V2 && derivedPositionInfo.pair) ||
    ((derivedPositionInfo.protocolVersion === ProtocolVersion.V3 ||
      derivedPositionInfo.protocolVersion === ProtocolVersion.V4) &&
      derivedPositionInfo.pool)

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (currencySearchInputState === undefined) {
        return
      }

      const otherInputState =
        currencySearchInputState === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
      const otherCurrency = currencyInputs[otherInputState]
      const wrappedCurrencyNew = currency.isNative ? currency.wrapped : currency
      const wrappedCurrencyOther = otherCurrency?.isNative ? otherCurrency.wrapped : otherCurrency

      setSelectedChainId(currency.chainId)

      if (areCurrenciesEqual(currency, otherCurrency) || areCurrenciesEqual(wrappedCurrencyNew, wrappedCurrencyOther)) {
        setPositionState((prevState) => ({
          ...prevState,
          currencyInputs: {
            ...prevState.currencyInputs,
            [otherInputState]: undefined,
            [currencySearchInputState]: currency,
          },
        }))
        return
      }

      if (otherCurrency && otherCurrency?.chainId !== currency.chainId) {
        setPositionState((prevState) => ({
          ...prevState,
          currencyInputs: { [otherInputState]: undefined, [currencySearchInputState]: currency },
        }))
        return
      }

      switch (currencySearchInputState) {
        case PositionField.TOKEN0:
        case PositionField.TOKEN1:
          // If the tokens change, we want to reset the default fee tier in the useEffect below.
          setDefaultFeeTierSelected(false)
          setPositionState((prevState) => ({
            ...prevState,
            currencyInputs: { ...prevState.currencyInputs, [currencySearchInputState]: currency },
          }))
          break
        default:
          break
      }
    },
    [currencyInputs, currencySearchInputState, setPositionState, setSelectedChainId],
  )

  const handleFeeTierSelect = useCallback(
    (feeData: FeeData) => {
      setPositionState((prevState) => ({ ...prevState, fee: feeData }))
      sendAnalyticsEvent(LiquidityEventName.SELECT_LIQUIDITY_POOL_FEE_TIER, {
        action: FeePoolSelectAction.MANUAL,
        fee_tier: feeData.feeAmount,
        ...trace,
      })
    },
    [setPositionState, trace],
  )

  const { feeTierData, hasExistingFeeTiers } = useAllFeeTierPoolData({
    chainId: token0?.chainId,
    protocolVersion,
    currencies: derivedPositionInfo.currencies,
    hook: hook ?? ZERO_ADDRESS,
  })

  const feeTiers = getDefaultFeeTiersWithData({ chainId: token0?.chainId, feeTierData, protocolVersion, t })
  const [defaultFeeTierSelected, setDefaultFeeTierSelected] = useState(false)
  const mostUsedFeeTier = useMemo(() => {
    if (hasExistingFeeTiers && feeTierData && Object.keys(feeTierData).length > 0) {
      return Object.values(feeTierData).reduce((highest, current) => {
        return current.percentage.greaterThan(highest.percentage) ? current : highest
      })
    }

    return undefined
  }, [hasExistingFeeTiers, feeTierData])

  useEffect(() => {
    if (mostUsedFeeTier && !defaultFeeTierSelected) {
      setDefaultFeeTierSelected(true)
      setPositionState((prevState) => ({
        ...prevState,
        fee: mostUsedFeeTier.fee,
      }))
      sendAnalyticsEvent(LiquidityEventName.SELECT_LIQUIDITY_POOL_FEE_TIER, {
        action: FeePoolSelectAction.RECOMMENDED,
        fee_tier: mostUsedFeeTier.fee.feeAmount,
        ...trace,
      })
    }
  }, [mostUsedFeeTier, defaultFeeTierSelected, setPositionState, trace])

  const { chains } = useEnabledChains()
  const supportedChains = useMemo(() => {
    return protocolVersion === ProtocolVersion.V4
      ? chains.filter((chain) => !isV4UnsupportedChain(chain))
      : protocolVersion === ProtocolVersion.V2
        ? chains.filter((chain) => SUPPORTED_V2POOL_CHAIN_IDS.includes(chain))
        : undefined
  }, [protocolVersion, chains])

  const handleOnContinue = () => {
    if (hook !== userApprovedHook) {
      setHookModalOpen(true)
    } else {
      onContinue()
    }
  }

  const wrappedNativeWarning = useMemo((): WrappedNativeWarning | undefined => {
    if (protocolVersion !== ProtocolVersion.V4) {
      return undefined
    }

    const wethToken0 = token0 && WRAPPED_NATIVE_CURRENCY[token0?.chainId]
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

    const wethToken1 = token1 && WRAPPED_NATIVE_CURRENCY[token1?.chainId]
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

    return undefined
  }, [token0, token1, protocolVersion])

  const token0CurrencyInfo = useCurrencyInfo(currencyId(token0))
  const token1CurrencyInfo = useCurrencyInfo(currencyId(token1))

  const token0FoTError = hasLPFoTTransferError(token0CurrencyInfo, protocolVersion)
  const token1FoTError = hasLPFoTTransferError(token1CurrencyInfo, protocolVersion)
  const fotErrorToken = token0FoTError || token1FoTError

  const hasError = isV4UnsupportedTokenSelected || Boolean(wrappedNativeWarning) || Boolean(fotErrorToken)

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
        <Container {...rest}>
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
                  <CurrencySelector
                    currencyInfo={token0CurrencyInfo}
                    onPress={() => setCurrencySearchInputState(PositionField.TOKEN0)}
                  />
                  <CurrencySelector
                    currencyInfo={token1CurrencyInfo}
                    onPress={() => setCurrencySearchInputState(PositionField.TOKEN1)}
                  />
                </Flex>
              )}
              <SelectStepError
                isV4UnsupportedTokenSelected={isV4UnsupportedTokenSelected}
                wrappedNativeWarning={wrappedNativeWarning}
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
                <Flex
                  row
                  py="$spacing12"
                  px="$spacing16"
                  gap="$spacing24"
                  justifyContent="space-between"
                  alignItems="center"
                  borderRadius="$rounded12"
                  borderWidth="$spacing1"
                  borderColor="$surface3"
                >
                  <Flex gap="$gap4" flex={1} minWidth={0}>
                    <Flex row gap="$gap8" alignItems="center">
                      <Text variant="subheading2" color="$neutral1">
                        {isDynamicFeeTier(fee) ? (
                          <Trans i18nKey="fee.tier.dynamic" />
                        ) : (
                          <Trans
                            i18nKey="fee.tierExact"
                            values={{ fee: formatPercent(new Percent(fee.feeAmount, 1000000), 4) }}
                          />
                        )}
                      </Text>
                      {fee.feeAmount === mostUsedFeeTier?.fee.feeAmount ? (
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
                      ) : feeTiers.find((tier) => tier.value.feeAmount === fee.feeAmount) ? null : (
                        <Flex justifyContent="center" borderRadius="$rounded6" backgroundColor="$surface3" px={7}>
                          <Text variant="buttonLabel4">
                            <Trans i18nKey="fee.tier.new" />
                          </Text>
                        </Flex>
                      )}
                    </Flex>
                    <Text variant="body3" color="$neutral2">
                      <Trans i18nKey="fee.tier.label" />
                    </Text>
                  </Flex>
                  <Button
                    fill={false}
                    isDisabled={!currencyInputs.TOKEN0 || !currencyInputs.TOKEN1}
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
                <HeightAnimator open={isShowMoreFeeTiersEnabled}>
                  <Flex flexDirection="column" display="flex" gap="$gap12">
                    <Flex
                      $platform-web={{
                        display: 'grid',
                      }}
                      gridTemplateColumns="repeat(4, 1fr)"
                      $md={{
                        gridTemplateColumns: 'repeat(2, 1fr)',
                      }}
                      gap={10}
                    >
                      {feeTiers.map((feeTier) => (
                        <FeeTier
                          key={feeTier.value.feeAmount}
                          feeTier={feeTier}
                          selected={feeTier.value.feeAmount === fee.feeAmount}
                          onSelect={handleFeeTierSelect}
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
              isDisabled={!continueButtonEnabled || hasError}
            >
              {t('common.button.continue')}
            </Button>
          </Flex>
        </Container>

        <CurrencySearchModal
          isOpen={currencySearchInputState !== undefined}
          onDismiss={() => setCurrencySearchInputState(undefined)}
          onCurrencySelect={handleCurrencySelect}
          chainIds={supportedChains}
        />
      </PrefetchBalancesWrapper>
    </>
  )
}

function SelectStepError({
  isV4UnsupportedTokenSelected,
  wrappedNativeWarning,
  fotToken,
}: {
  isV4UnsupportedTokenSelected: boolean
  wrappedNativeWarning?: WrappedNativeWarning
  fotToken?: CurrencyInfo
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setPositionState } = useCreatePositionContext()

  if (isV4UnsupportedTokenSelected) {
    return <ErrorCallout errorMessage={true} title={t('position.migrate.v4unsupportedChain')} />
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
          setPositionState((prevState) => ({
            ...DEFAULT_POSITION_STATE,
            currencyInputs: prevState.currencyInputs,
            protocolVersion: ProtocolVersion.V2,
          }))
        }}
      />
    )
  }

  return null
}
