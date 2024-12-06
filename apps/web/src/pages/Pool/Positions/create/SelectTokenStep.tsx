import { FeePoolSelectAction, LiquidityEventName } from '@uniswap/analytics-events'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Percent } from '@uniswap/sdk-core'
import { LoaderButton } from 'components/Button/LoaderButton'
import { useAllFeeTierPoolData } from 'components/Liquidity/hooks'
import { getDefaultFeeTiersWithData, isDynamicFeeTier } from 'components/Liquidity/utils'
import { DoubleCurrencyAndChainLogo } from 'components/Logo/DoubleLogo'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useCurrencyInfo } from 'hooks/Tokens'
import { AddHook } from 'pages/Pool/Positions/create/AddHook'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { AdvancedButton, Container } from 'pages/Pool/Positions/create/shared'
import { FeeData } from 'pages/Pool/Positions/create/types'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { TamaguiClickableStyle } from 'theme/components'
import { PositionField } from 'types/position'
import { Button, Flex, FlexProps, HeightAnimator, Text, styled } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Search } from 'ui/src/components/icons/Search'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { areCurrenciesEqual } from 'uniswap/src/utils/currencyId'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useFormatter } from 'utils/formatNumbers'

const CurrencySelector = ({ currency, onPress }: { currency?: Currency; onPress: () => void }) => {
  const { t } = useTranslation()
  // TODO: remove when backend returns token logos in graphql response: WEB-4920
  const currencyInfo = useCurrencyInfo(currency)

  return (
    <Button
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
    </Button>
  )
}

interface FeeTier {
  value: FeeData
  title: string
  selectionPercent?: Percent
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
  const { formatPercent } = useFormatter()

  return (
    <FeeTierContainer onPress={() => onSelect(feeTier.value)} background={selected ? '$surface3' : '$surface1'}>
      <Flex row gap={10} justifyContent="space-between" alignItems="center">
        <Text variant="buttonLabel3">{formatPercent(new Percent(feeTier.value.feeAmount, 1000000))}</Text>
        {selected && <CheckCircleFilled right={0} position="absolute" size={iconSizes.icon20} />}
      </Flex>
      <Text variant="body4">{feeTier.title}</Text>
      {feeTier.selectionPercent && feeTier.selectionPercent.greaterThan(0) && (
        <Text variant="body4" color="$neutral2">
          {formatPercent(feeTier.selectionPercent)} select
        </Text>
      )}
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

  const {
    positionState: { currencyInputs, fee, protocolVersion },
    setPositionState,
    derivedPositionInfo,
    setFeeTierSearchModalOpen,
  } = useCreatePositionContext()

  const [token0, token1] = derivedPositionInfo.currencies
  const [currencySearchInputState, setCurrencySearchInputState] = useState<PositionField | undefined>(undefined)
  const [isShowMoreFeeTiersEnabled, toggleShowMoreFeeTiersEnabled] = useReducer((state) => !state, false)
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
  })

  const feeTiers = getDefaultFeeTiersWithData({ chainId: token0?.chainId, feeTierData, t })
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

  return (
    <>
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
                <DoubleCurrencyAndChainLogo chainId={token0.chainId} currencies={[token0, token1]} size={44} />
                <Flex grow>
                  <Text variant="heading3">
                    {token0.symbol} / {token1.symbol}
                  </Text>
                </Flex>
              </Flex>
            ) : (
              <Flex row gap="$gap16" $md={{ flexDirection: 'column' }}>
                <CurrencySelector currency={token0} onPress={() => setCurrencySearchInputState(PositionField.TOKEN0)} />
                <CurrencySelector currency={token1} onPress={() => setCurrencySearchInputState(PositionField.TOKEN1)} />
              </Flex>
            )}
            {protocolVersion === ProtocolVersion.V4 && <AddHook />}
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
            <Flex gap="$spacing8">
              <Flex
                row
                py="$spacing12"
                px="$spacing16"
                gap="$spacing24"
                justifyContent="space-between"
                alignItems="center"
                borderRadius="$rounded12"
                borderWidth={1}
                borderColor="$surface3"
              >
                <Flex gap="$gap4">
                  <Flex row gap="$gap8">
                    <Text variant="subheading2" color="$neutral1">
                      {isDynamicFeeTier(fee) ? (
                        <Trans i18nKey="fee.tier.dynamic" />
                      ) : (
                        <Trans
                          i18nKey="fee.tierExact"
                          values={{ fee: formatPercent(new Percent(fee.feeAmount, 1000000)) }}
                        />
                      )}
                    </Text>
                    {fee.feeAmount === mostUsedFeeTier?.fee.feeAmount ? (
                      <Flex
                        justifyContent="center"
                        borderRadius="$rounded6"
                        backgroundColor="$surface3"
                        px={7}
                        $md={{ display: 'none' }}
                      >
                        <Text variant="buttonLabel4">
                          <Trans i18nKey="fee.tier.recommended" />
                        </Text>
                      </Flex>
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
                  disabled={!currencyInputs.TOKEN0 || !currencyInputs.TOKEN1}
                  size="small"
                  px="$spacing12"
                  my="auto"
                  gap="$gap4"
                  theme="secondary"
                  onPress={toggleShowMoreFeeTiersEnabled}
                >
                  <Text variant="buttonLabel4" $md={{ display: 'none' }}>
                    {isShowMoreFeeTiersEnabled ? t('common.less') : t('common.more')}
                  </Text>
                  <RotatableChevron
                    direction={isShowMoreFeeTiersEnabled ? 'up' : 'down'}
                    color="$neutral2"
                    width={iconSizes.icon20}
                    height={iconSizes.icon20}
                  />
                </Button>
              </Flex>
              <HeightAnimator open={isShowMoreFeeTiersEnabled}>
                <Flex flexDirection="column" display="flex" gap="$gap12">
                  <Flex
                    display="flex"
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
        <LoaderButton
          buttonKey="SelectTokensStep-continue"
          flex={1}
          py="$spacing16"
          px="$spacing20"
          backgroundColor="$accent3"
          hoverStyle={{
            backgroundColor: undefined,
            opacity: 0.8,
          }}
          pressStyle={{
            backgroundColor: undefined,
          }}
          onPress={onContinue}
          loading={Boolean(!continueButtonEnabled && token0 && token1)}
          loaderColor="$surface1"
          disabled={!continueButtonEnabled}
        >
          <Text variant="buttonLabel1" color="$surface1">
            <Trans i18nKey="common.button.continue" />
          </Text>
        </LoaderButton>
      </Container>

      <CurrencySearchModal
        isOpen={currencySearchInputState !== undefined}
        onDismiss={() => setCurrencySearchInputState(undefined)}
        onCurrencySelect={handleCurrencySelect}
      />
    </>
  )
}
