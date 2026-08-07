import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { ErrorCallout } from '~/components/ErrorCallout'
import { LPGeoRestrictionBanner } from '~/components/GeoRestriction/LPGeoRestrictionBanner'
import { DepositInputForm } from '~/features/Liquidity/DepositInputForm'
import { useUpdatedAmountsFromDependentAmount } from '~/features/Liquidity/hooks/useDependentAmountFallback'
import { LiquidityModalDetailRows } from '~/features/Liquidity/LiquidityModalDetailRows'
import { LiquidityPositionInfo } from '~/features/Liquidity/LiquidityPositionInfo'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useLPPermissionedGating } from '~/features/Liquidity/usePermissionedLP'
import { canUnwrapCurrency } from '~/features/Liquidity/utils/currency'
import { getFieldsDisabled } from '~/features/Liquidity/utils/priceRangeInfo'
import { IncreaseLiquidityStep, useIncreaseLiquidityContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityContext'
import { IncreaseLiquidityCta } from '~/pages/IncreaseLiquidity/IncreaseLiquidityCta'
import { IncreaseLiquidityPermissionedGate } from '~/pages/IncreaseLiquidity/IncreaseLiquidityPermissionedGate'
import { useIncreaseLiquidityTxContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { PositionField } from '~/types/position'

export function IncreaseLiquidityForm() {
  const { t } = useTranslation()

  const {
    setStep,
    increaseLiquidityState,
    derivedIncreaseLiquidityInfo,
    setIncreaseLiquidityState,
    unwrapNativeCurrency,
    setUnwrapNativeCurrency,
    preEstimatedGasFee,
  } = useIncreaseLiquidityContext()
  const { formattedAmounts, currencyAmounts, currencyAmountsUSDValue, currencyBalances, currencies, error } =
    derivedIncreaseLiquidityInfo
  const { position, exactField } = increaseLiquidityState

  const {
    gasFeeEstimateUSD,
    txInfo,
    error: dataFetchingError,
    refetch,
    dependentAmount,
    fotErrorToken,
  } = useIncreaseLiquidityTxContext()

  // KYC-rejection parity with the swap flow (ECO-578): run the same client-side allowlist
  // check the swap form and deposit step use, so a non-allowlisted wallet sees the
  // permissioned banner + Verify Identity flow instead of the backend's raw calldata error.
  const {
    isPermissionedAndNotAllowlisted: showVerifyIdentity,
    permissionedTokenSymbol,
    permissionedConfig,
  } = useLPPermissionedGating({
    token0: position?.currency0Amount.currency,
    token1: position?.currency1Amount.currency,
  })
  const { isGeoRestricted, restrictedTokenSymbol, unavailableLabel } = useLPGeoRestriction({
    token0: position?.currency0Amount.currency,
    token1: position?.currency1Amount.currency,
  })
  // Local state, NOT the global modal slot (ModalName.VerifyIdentity): this form lives inside
  // the AddLiquidity modal, which mounts only while the single-slot openModal is AddLiquidity.
  // Dispatching another modal name would unmount this whole subtree, sheet included.
  const {
    value: isVerifyIdentityOpen,
    setTrue: openVerifyIdentity,
    setFalse: closeVerifyIdentity,
  } = useBooleanState(false)

  if (!position) {
    throw new Error('AddLiquidityModal must have an initial state when opening')
  }

  const { currency0Amount: initialCurrency0Amount, currency1Amount: initialCurrency1Amount } = position

  const canUnwrap0 = canUnwrapCurrency(initialCurrency0Amount.currency, position.version)
  const canUnwrap1 = canUnwrapCurrency(initialCurrency1Amount.currency, position.version)

  const nativeCurrency = nativeOnChain(position.chainId)

  const { tickLower, tickUpper } = position
  const { TOKEN0: deposit0Disabled, TOKEN1: deposit1Disabled } = getFieldsDisabled({
    ticks: [tickLower, tickUpper],
    poolOrPair: position.version === ProtocolVersion.V2 ? undefined : position.poolOrPair,
  })
  const { updatedFormattedAmounts, updatedUSDAmounts, updatedDeposit0Disabled, updatedDeposit1Disabled } =
    useUpdatedAmountsFromDependentAmount({
      token0: currencies?.TOKEN0,
      token1: currencies?.TOKEN1,
      dependentAmount,
      exactField,
      currencyAmounts,
      currencyAmountsUSDValue,
      formattedAmounts,
      deposit0Disabled,
      deposit1Disabled,
    })

  const handleUserInput = (field: PositionField, newValue: string) => {
    setIncreaseLiquidityState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: newValue,
    }))
  }

  const handleOnSetMax = (field: PositionField, amount: string) => {
    setIncreaseLiquidityState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: amount,
    }))
  }

  const handleOnContinue = () => {
    if (!error) {
      setStep(IncreaseLiquidityStep.Review)
    }
  }

  const UnwrapNativeCurrencyToggle = useMemo(() => {
    return (
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="body3" color="$neutral2">
          {t('pool.addAs', { nativeWrappedSymbol: nativeCurrency.symbol ?? t('common.token') })}
        </Text>
        <Switch
          id="add-as-weth"
          checked={unwrapNativeCurrency}
          // oxlint-disable-next-line no-shadow
          onCheckedChange={() => setUnwrapNativeCurrency((unwrapNativeCurrency) => !unwrapNativeCurrency)}
          variant="branded"
        />
      </Flex>
    )
  }, [nativeCurrency, t, unwrapNativeCurrency, setUnwrapNativeCurrency])

  const requestLoading = Boolean(
    !dataFetchingError &&
    !error &&
    currencyAmounts?.TOKEN0 &&
    currencyAmounts.TOKEN1 &&
    !txInfo?.txRequest &&
    !fotErrorToken,
  )

  return (
    <Flex gap="$gap24">
      <Flex gap="$gap24">
        <LiquidityPositionInfo positionInfo={position} />
        <DepositInputForm
          token0={currencies?.TOKEN0}
          token1={currencies?.TOKEN1}
          formattedAmounts={updatedFormattedAmounts}
          currencyAmounts={currencyAmounts}
          currencyAmountsUSDValue={updatedUSDAmounts}
          currencyBalances={currencyBalances}
          onUserInput={handleUserInput}
          onSetMax={handleOnSetMax}
          deposit0Disabled={updatedDeposit0Disabled}
          deposit1Disabled={updatedDeposit1Disabled}
          amount0Loading={requestLoading && exactField === PositionField.TOKEN1} // check isRefetching instead
          amount1Loading={requestLoading && exactField === PositionField.TOKEN0}
          token0UnderCardComponent={canUnwrap0 ? UnwrapNativeCurrencyToggle : undefined}
          token1UnderCardComponent={canUnwrap1 ? UnwrapNativeCurrencyToggle : undefined}
          actualGasFee={preEstimatedGasFee}
        />
      </Flex>
      <LiquidityModalDetailRows
        currency0Amount={initialCurrency0Amount}
        currency1Amount={initialCurrency1Amount}
        networkCost={gasFeeEstimateUSD}
      />
      {fotErrorToken && (
        <ErrorCallout
          errorMessage={true}
          title={t('token.safety.warning.fotLow.title')}
          description={t('position.increase.fot', { token: fotErrorToken.currency.symbol ?? t('common.token') })}
        />
      )}
      <IncreaseLiquidityGate
        isGeoRestricted={isGeoRestricted}
        restrictedTokenSymbol={restrictedTokenSymbol}
        showVerifyIdentity={showVerifyIdentity}
        permissionedTokenSymbol={permissionedTokenSymbol}
        permissionedConfig={permissionedConfig}
        isVerifyIdentityOpen={isVerifyIdentityOpen}
        onCloseVerifyIdentity={closeVerifyIdentity}
        dataFetchingError={dataFetchingError}
        onRefetch={refetch}
      />
      <Flex row>
        <IncreaseLiquidityCta
          isGeoRestricted={isGeoRestricted}
          geoUnavailableLabel={unavailableLabel}
          showVerifyIdentity={showVerifyIdentity}
          onVerifyIdentity={openVerifyIdentity}
          onReview={handleOnContinue}
          disabled={Boolean(error) || !txInfo?.txRequest || Boolean(fotErrorToken)}
          requestLoading={requestLoading}
          error={error}
        />
      </Flex>
    </Flex>
  )
}

type IncreaseLiquidityGateProps = {
  isGeoRestricted: boolean
  restrictedTokenSymbol: string | undefined
  showVerifyIdentity: boolean
  permissionedTokenSymbol: string | undefined
  permissionedConfig: { registrationUrl: string; issuer: string } | undefined
  isVerifyIdentityOpen: boolean
  onCloseVerifyIdentity: () => void
  dataFetchingError: boolean | string
  onRefetch: (() => void) | undefined
}

/**
 * The blocked-state messaging for this form: at most one gate shows, and it owns the message.
 *
 * The geo block replaces the Verify Identity gate rather than stacking with it — identity
 * verification cannot unblock a region-restricted token, so offering it would be a dead end. Either
 * gate also suppresses `dataFetchingError`, because whatever the calldata request returns is expected
 * noise once we know the reason; the banner plus the CTA carry it instead (matching swap). For the
 * permissioned case that response is a known 403 (ECO-578); for the geo case we have not verified what
 * the backend does, which is why the client-side reason is what gets shown.
 */
function IncreaseLiquidityGate({
  isGeoRestricted,
  restrictedTokenSymbol,
  showVerifyIdentity,
  permissionedTokenSymbol,
  permissionedConfig,
  isVerifyIdentityOpen,
  onCloseVerifyIdentity,
  dataFetchingError,
  onRefetch,
}: IncreaseLiquidityGateProps): JSX.Element {
  if (isGeoRestricted) {
    return <LPGeoRestrictionBanner tokenSymbol={restrictedTokenSymbol} />
  }
  return (
    <>
      <IncreaseLiquidityPermissionedGate
        showVerifyIdentity={showVerifyIdentity}
        tokenSymbol={permissionedTokenSymbol}
        permissionedConfig={permissionedConfig}
        isVerifyIdentityOpen={isVerifyIdentityOpen}
        onCloseVerifyIdentity={onCloseVerifyIdentity}
      />
      <ErrorCallout errorMessage={showVerifyIdentity ? false : dataFetchingError} onPress={onRefetch} />
    </>
  )
}
