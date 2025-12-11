import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { ErrorCallout } from 'components/ErrorCallout'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { FormStepsWrapper, FormWrapper } from 'components/Liquidity/Create/FormWrapper'
import { useLiquidityUrlState } from 'components/Liquidity/Create/hooks/useLiquidityUrlState'
import { useLPSlippageValue } from 'components/Liquidity/Create/hooks/useLPSlippageValues'
import { DEFAULT_POSITION_STATE, InitialPosition, PositionFlowStep } from 'components/Liquidity/Create/types'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { LoadingRow } from 'components/Liquidity/Loader'
import { ReviewModal } from 'components/Liquidity/ReviewModal'
import type { PositionInfo } from 'components/Liquidity/types'
import { getCurrencyForProtocol } from 'components/Liquidity/utils/currency'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { LoadingRows } from 'components/Loader/styled'
import { useAccount } from 'hooks/useAccount'
import { usePositionOwnerV2 } from 'hooks/usePositionOwnerV2'
import useSelectChain from 'hooks/useSelectChain'
import {
  CreateLiquidityContextProvider,
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { SharedCreateModals } from 'pages/CreatePosition/CreatePosition'
import useInitialPosition from 'pages/Migrate/hooks/useInitialPosition'
import { MigratePositionTxContextProvider, useMigrateTxContext } from 'pages/Migrate/MigrateLiquidityTxContext'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate, useParams } from 'react-router'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Main, styled } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfacePageName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay } from 'uniswap/src/features/transactions/liquidity/utils'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useChainIdFromUrlParam } from 'utils/chainParams'

const BodyWrapper = styled(Main, {
  backgroundColor: '$surface1',
  display: 'flex',
  flexDirection: 'row',
  gap: 60,
  mt: '1rem',
  mx: 'auto',
  width: '100%',
  zIndex: '$default',
  p: 24,
})

function MigrateInner({
  positionInfo,
  currencyInputs,
  setCurrencyInputs,
}: {
  positionInfo: PositionInfo
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  const { pairAddress } = useParams<{ tokenId: string; chainName: string; pairAddress: string }>()
  const trace = useTrace()
  const { t } = useTranslation()

  const { setStep, setCurrentTransactionStep } = useCreateLiquidityContext()
  const { version: initialProtocolVersion } = positionInfo

  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([])
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const account = useWallet().evmAccount
  const dispatch = useDispatch()
  const { txInfo, transactionError, refetch, setTransactionError, refundedAmounts } = useMigrateTxContext()
  const navigate = useNavigate()

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const onClose = useCallback(() => {
    setIsReviewModalOpen(false)
    setTransactionError(false)
  }, [setTransactionError])

  const { currency0Amount, currency1Amount, owner } = positionInfo

  const currency0FiatAmount = useUSDCValue(currency0Amount)
  const currency1FiatAmount = useUSDCValue(currency1Amount)

  const areAddressesEqualV3 = areAddressesEqual({
    addressInput1: { address: account?.address, platform: Platform.EVM },
    addressInput2: { address: owner, platform: Platform.EVM },
  })

  const isOwnerV2 = usePositionOwnerV2({
    account: account?.address,
    address: pairAddress,
    chainId: positionInfo.chainId,
  })

  if (
    (initialProtocolVersion === ProtocolVersion.V2 && !isOwnerV2) ||
    (initialProtocolVersion === ProtocolVersion.V3 && !areAddressesEqualV3)
  ) {
    navigate('/positions')
  }

  const handleConfirm = useCallback(() => {
    setTransactionError(false)

    const isValidTx = isValidLiquidityTxContext(txInfo)
    if (!account || !isSignerMnemonicAccountDetails(account) || !isValidTx) {
      return
    }

    dispatch(
      liquiditySaga.actions.trigger({
        selectChain,
        startChainId,
        account,
        liquidityTxContext: txInfo,
        setCurrentStep: setCurrentTransactionStep,
        setSteps: setTransactionSteps,
        onSuccess: () => {
          onClose()
          navigate('/positions')
        },
        onFailure: (e) => {
          if (e) {
            setTransactionError(
              getErrorMessageToDisplay({
                calldataError: e,
              }),
            )
          }
          setCurrentTransactionStep(undefined)
        },
        analytics: {
          ...getLPBaseAnalyticsProperties({
            trace,
            fee: positionInfo.feeTier?.feeAmount,
            tickSpacing: positionInfo.tickSpacing,
            tickLower: positionInfo.tickLower,
            tickUpper: positionInfo.tickUpper,
            hook: undefined,
            currency0: currency0Amount.currency,
            currency1: currency1Amount.currency,
            currency0AmountUsd: currency0FiatAmount,
            currency1AmountUsd: currency1FiatAmount,
            poolId: positionInfo.poolId,
            version: ProtocolVersion.V3,
          }),
          action: 'V3->V4',
        },
      }),
    )
  }, [
    account,
    dispatch,
    selectChain,
    startChainId,
    txInfo,
    trace,
    positionInfo,
    currency0FiatAmount,
    currency1FiatAmount,
    onClose,
    navigate,
    setCurrentTransactionStep,
    setTransactionError,
    currency0Amount.currency,
    currency1Amount.currency,
  ])

  // biome-ignore lint/correctness/useExhaustiveDependencies: +setIsReviewModalOpen
  const priceRangeProps = useMemo(() => {
    return {
      positionInfo,
      disableContinue: !txInfo || Boolean(transactionError),
      onContinue: () => {
        setIsReviewModalOpen(true)
      },
    }
  }, [txInfo, transactionError, positionInfo, setIsReviewModalOpen])

  return (
    <>
      <Flex gap="$gap16">
        <LiquidityPositionCard liquidityPosition={positionInfo} disabled />
        <Flex justifyContent="center" alignItems="center">
          <Flex shrink backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12">
            <ArrowDown size={20} color="$neutral1" />
          </Flex>
        </Flex>
        <FormStepsWrapper
          isMigration
          currencyInputs={currencyInputs}
          setCurrencyInputs={setCurrencyInputs}
          selectSectionName={SectionName.MigrateSelectTokensStep}
          priceRangeSectionName={SectionName.MigratePriceRangeStep}
          priceRangeProps={priceRangeProps}
          onSelectTokensContinue={() => {
            setStep(PositionFlowStep.PRICE_RANGE)
          }}
        />
        {!isReviewModalOpen && (
          <Flex mb="$spacing20">
            <ErrorCallout errorMessage={transactionError} onPress={refetch} />
          </Flex>
        )}
      </Flex>

      <ReviewModal
        modalName={ModalName.MigrateLiquidity}
        headerTitle={t('pool.migrateLiquidity')}
        depositText={t('migrate.migrating')}
        confirmButtonText={t('common.migrate')}
        currencyAmounts={{ TOKEN0: currency0Amount, TOKEN1: currency1Amount }}
        currencyAmountsUSDValue={{ TOKEN0: currency0FiatAmount, TOKEN1: currency1FiatAmount }}
        isDisabled={!txInfo?.action}
        refundedAmounts={refundedAmounts}
        transactionError={transactionError}
        steps={transactionSteps}
        isOpen={isReviewModalOpen}
        onClose={onClose}
        onConfirm={handleConfirm}
      />
    </>
  )
}

function getCurrencyInputs(positionInfo?: PositionInfo) {
  if (positionInfo?.version !== ProtocolVersion.V2 && positionInfo?.version !== ProtocolVersion.V3) {
    return {
      tokenA: undefined,
      tokenB: undefined,
    }
  }

  const finalProtocolVersion = positionInfo.version === ProtocolVersion.V2 ? ProtocolVersion.V3 : ProtocolVersion.V4

  return {
    tokenA: getCurrencyForProtocol(positionInfo.poolOrPair?.token0, finalProtocolVersion),
    tokenB: getCurrencyForProtocol(positionInfo.poolOrPair?.token1, finalProtocolVersion),
  }
}

function Toolbar({
  initialPosition,
  currency0Amount,
  currency1Amount,
  setCurrencyInputs,
}: {
  initialPosition: InitialPosition | undefined
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  const { positionState, priceRangeState, setPositionState, setStep, setPriceRangeState, setDepositState } =
    useCreateLiquidityContext()
  const { fee, hook, protocolVersion: finalProtocolVersion } = positionState

  const isFormUnchanged = useMemo(() => {
    const isRangeUnchanged = initialPosition?.isOutOfRange
      ? true
      : priceRangeState.fullRange === DEFAULT_PRICE_RANGE_STATE.fullRange &&
        priceRangeState.maxPrice === DEFAULT_PRICE_RANGE_STATE.maxPrice &&
        priceRangeState.minPrice === DEFAULT_PRICE_RANGE_STATE.minPrice

    return (
      fee &&
      initialPosition &&
      fee.feeAmount === initialPosition.fee.feeAmount &&
      fee.tickSpacing === initialPosition.fee.tickSpacing &&
      fee.isDynamic === initialPosition.fee.isDynamic &&
      hook === DEFAULT_POSITION_STATE.hook &&
      priceRangeState.initialPrice === DEFAULT_PRICE_RANGE_STATE.initialPrice &&
      isRangeUnchanged
    )
  }, [fee, hook, priceRangeState, initialPosition])

  return (
    <Flex>
      <Button
        size="small"
        emphasis="tertiary"
        fill={false}
        icon={<RotateLeft />}
        isDisabled={isFormUnchanged}
        onPress={() => {
          setPositionState({
            ...DEFAULT_POSITION_STATE,
            initialPosition,
            protocolVersion: finalProtocolVersion,
            fee: initialPosition?.fee,
          })
          setCurrencyInputs({
            tokenA: getCurrencyForProtocol(currency0Amount.currency, finalProtocolVersion),
            tokenB: getCurrencyForProtocol(currency1Amount.currency, finalProtocolVersion),
          })
          setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
          setDepositState(DEFAULT_DEPOSIT_STATE)
          setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
        }}
      >
        <Trans i18nKey="common.button.reset" />
      </Button>
    </Flex>
  )
}

/**
 * The page for migrating any v3 LP position to v4.
 */
export default function MigrateV3() {
  const { t } = useTranslation()
  const { chainName, tokenId } = useParams<{ tokenId: string; chainName: string }>()
  const { pairAddress } = useParams<{ pairAddress: string }>()

  const chainId = useChainIdFromUrlParam()
  const account = useAccount()
  const autoSlippageTolerance = useLPSlippageValue({
    version: ProtocolVersion.V3,
  })
  const { pathname } = useLocation()
  const protocolVersion = pathname.includes('v2') ? ProtocolVersion.V2 : ProtocolVersion.V3

  const urlState = useLiquidityUrlState()
  const { data, isLoading: positionLoading } = useGetPositionQuery(
    account.address
      ? {
          owner: account.address,
          protocolVersion,
          tokenId: protocolVersion === ProtocolVersion.V3 ? tokenId : undefined,
          pairAddress: protocolVersion === ProtocolVersion.V2 ? pairAddress : undefined,
          chainId: chainId ?? account.chainId,
        }
      : undefined,
  )

  const position = data?.position

  const positionInfo = useMemo(() => parseRestPosition(position), [position])

  // Need the initial position when migrating out of range positions.
  const initialPosition = useInitialPosition(positionInfo)
  const initialCurrencyInputs = useMemo(() => getCurrencyInputs(positionInfo), [positionInfo])
  const initialProtocolVersion = positionInfo?.version

  const [currencyInputs, setCurrencyInputs] = useState<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>(
    initialCurrencyInputs,
  )

  useEffect(() => {
    setCurrencyInputs(getCurrencyInputs(positionInfo))
  }, [positionInfo])

  // TODO (WEB-4920): show error state for non-v3 position here.
  if (
    positionLoading ||
    !position ||
    !positionInfo ||
    (initialProtocolVersion !== ProtocolVersion.V3 && initialProtocolVersion !== ProtocolVersion.V2)
  ) {
    return (
      <BodyWrapper>
        <LoadingRows>
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
        </LoadingRows>
      </BodyWrapper>
    )
  }

  const { currency0Amount, currency1Amount, feeTier } = positionInfo

  return (
    <Trace
      logImpression
      page={InterfacePageName.MigrateV3}
      properties={{
        pool_address: positionInfo.poolId,
        chain_id: chainId ?? account.chainId,
        label: [currency0Amount.currency.symbol, currency1Amount.currency.symbol].join('/'),
        fee_tier: feeTier,
        token0Address: currencyIdToAddress(currencyId(currency0Amount.currency)),
        token1Address: currencyIdToAddress(currencyId(currency1Amount.currency)),
      }}
    >
      <MultichainContextProvider initialChainId={chainId}>
        <LPTransactionSettingsStoreContextProvider autoSlippageTolerance={autoSlippageTolerance}>
          <CreateLiquidityContextProvider
            initialPositionState={{
              initialPosition,
              fee: initialPosition?.fee,
              protocolVersion: initialProtocolVersion === ProtocolVersion.V2 ? ProtocolVersion.V3 : ProtocolVersion.V4,
            }}
            currencyInputs={currencyInputs}
            setCurrencyInputs={setCurrencyInputs}
            initialFlowStep={urlState.flowStep}
          >
            <MigratePositionTxContextProvider positionInfo={positionInfo}>
              <FormWrapper
                isMigration
                title={t('common.migrate.position')}
                currentBreadcrumb={
                  <BreadcrumbNavLink
                    to={
                      initialProtocolVersion === ProtocolVersion.V2
                        ? `/positions/v2/${chainName}/${pairAddress}`
                        : `/positions/v3/${chainName}/${tokenId}`
                    }
                  >
                    {currency0Amount.currency.symbol} / {currency1Amount.currency.symbol} <ChevronRight size={14} />
                  </BreadcrumbNavLink>
                }
                toolbar={
                  <Toolbar
                    initialPosition={initialPosition}
                    currency0Amount={currency0Amount}
                    currency1Amount={currency1Amount}
                    setCurrencyInputs={setCurrencyInputs}
                  />
                }
              >
                <MigrateInner
                  positionInfo={positionInfo}
                  currencyInputs={currencyInputs}
                  setCurrencyInputs={setCurrencyInputs}
                />
              </FormWrapper>
            </MigratePositionTxContextProvider>
            <SharedCreateModals />
          </CreateLiquidityContextProvider>
        </LPTransactionSettingsStoreContextProvider>
      </MultichainContextProvider>
    </Trace>
  )
}
