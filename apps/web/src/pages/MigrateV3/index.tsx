import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { ErrorCallout } from 'components/ErrorCallout'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { FormStepsWrapper, FormWrapper } from 'components/Liquidity/Create/FormWrapper'
import { useLiquidityUrlState } from 'components/Liquidity/Create/hooks/useLiquidityUrlState'
import { useLPSlippageValue } from 'components/Liquidity/Create/hooks/useLPSlippageValues'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'components/Liquidity/Create/types'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { LoadingRow } from 'components/Liquidity/Loader'
import { TokenInfo } from 'components/Liquidity/TokenInfo'
import type { PositionInfo } from 'components/Liquidity/types'
import { getCurrencyForProtocol } from 'components/Liquidity/utils/currency'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { LoadingRows } from 'components/Loader/styled'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import {
  CreateLiquidityContextProvider,
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { SharedCreateModals } from 'pages/CreatePosition/CreatePosition'
import useInitialPosition from 'pages/MigrateV3/hooks/useInitialPosition'
import { MigrateV3PositionTxContextProvider, useMigrateV3TxContext } from 'pages/MigrateV3/MigrateV3LiquidityTxContext'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate, useParams } from 'react-router'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Main, styled, Text } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { Modal } from 'uniswap/src/components/modals/Modal'
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

function MigrateV3Inner({
  positionInfo,
  currencyInputs,
  setCurrencyInputs,
}: {
  positionInfo: PositionInfo
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  const trace = useTrace()
  const { t } = useTranslation()

  const { setStep, currentTransactionStep, setCurrentTransactionStep } = useCreateLiquidityContext()

  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([])
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const account = useWallet().evmAccount
  const dispatch = useDispatch()
  const { txInfo, transactionError, refetch, setTransactionError } = useMigrateV3TxContext()
  const navigate = useNavigate()

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const onClose = useCallback(() => {
    setIsReviewModalOpen(false)
    setTransactionError(false)
  }, [setTransactionError])

  const { currency0Amount, currency1Amount, owner } = positionInfo

  const currency0FiatAmount = useUSDCValue(currency0Amount)
  const currency1FiatAmount = useUSDCValue(currency1Amount)

  if (
    !areAddressesEqual({
      addressInput1: { address: account?.address, platform: Platform.EVM },
      addressInput2: { address: owner, platform: Platform.EVM },
    })
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

      <Modal
        name={ModalName.MigrateLiquidity}
        onClose={onClose}
        isDismissible
        isModalOpen={isReviewModalOpen}
        padding="$none"
      >
        <Flex px="$spacing8" pt="$spacing12" pb="$spacing8" gap="$spacing24">
          <LiquidityModalHeader title={t('pool.migrateLiquidity')} closeModal={onClose} />
          <Flex gap="$gap16" px="$padding16" my="$spacing8">
            <TokenInfo currencyAmount={currency0Amount} currencyUSDAmount={currency0FiatAmount} isMigrating />
            <Text variant="body3" color="$neutral2">
              {t('common.and')}
            </Text>
            <TokenInfo currencyAmount={currency1Amount} currencyUSDAmount={currency1FiatAmount} isMigrating />
          </Flex>
          <ErrorCallout errorMessage={transactionError} />
          {currentTransactionStep && transactionSteps.length > 1 ? (
            <ProgressIndicator steps={transactionSteps} currentStep={currentTransactionStep} />
          ) : (
            <Button
              size="large"
              variant="branded"
              fill={false}
              onPress={handleConfirm}
              loading={Boolean(currentTransactionStep)}
            >
              {currentTransactionStep ? t('common.confirmWallet') : t('common.migrate')}
            </Button>
          )}
        </Flex>
      </Modal>
    </>
  )
}

function getCurrencyInputs(positionInfo?: PositionInfo) {
  if (positionInfo?.version !== ProtocolVersion.V3) {
    return {
      tokenA: undefined,
      tokenB: undefined,
    }
  }

  return {
    tokenA: getCurrencyForProtocol(positionInfo.poolOrPair?.token0, ProtocolVersion.V4),
    tokenB: getCurrencyForProtocol(positionInfo.poolOrPair?.token1, ProtocolVersion.V4),
  }
}

function Toolbar({
  initialPosition,
  currency0Amount,
  currency1Amount,
  setCurrencyInputs,
}: {
  initialPosition: { tickLower: number; tickUpper: number; isOutOfRange: boolean } | undefined
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  const { positionState, priceRangeState, setPositionState, setStep, setPriceRangeState, setDepositState } =
    useCreateLiquidityContext()
  const { protocolVersion, fee, hook } = positionState

  const isFormUnchanged = useMemo(() => {
    const isRangeUnchanged = initialPosition?.isOutOfRange
      ? true
      : priceRangeState.fullRange === DEFAULT_PRICE_RANGE_STATE.fullRange &&
        priceRangeState.maxPrice === DEFAULT_PRICE_RANGE_STATE.maxPrice &&
        priceRangeState.minPrice === DEFAULT_PRICE_RANGE_STATE.minPrice

    return (
      fee.feeAmount === DEFAULT_POSITION_STATE.fee.feeAmount &&
      fee.tickSpacing === DEFAULT_POSITION_STATE.fee.tickSpacing &&
      fee.isDynamic === DEFAULT_POSITION_STATE.fee.isDynamic &&
      hook === DEFAULT_POSITION_STATE.hook &&
      priceRangeState.initialPrice === DEFAULT_PRICE_RANGE_STATE.initialPrice &&
      isRangeUnchanged
    )
  }, [fee, hook, priceRangeState, initialPosition?.isOutOfRange])

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
            protocolVersion,
          })
          setCurrencyInputs({
            tokenA: getCurrencyForProtocol(currency0Amount.currency, protocolVersion),
            tokenB: getCurrencyForProtocol(currency1Amount.currency, protocolVersion),
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

  const [currencyInputs, setCurrencyInputs] = useState<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>(
    initialCurrencyInputs,
  )

  useEffect(() => {
    setCurrencyInputs(getCurrencyInputs(positionInfo))
  }, [positionInfo])

  // TODO (WEB-4920): show error state for non-v3 position here.
  if (positionLoading || !position || !positionInfo || positionInfo.version !== ProtocolVersion.V3) {
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
            initialPositionState={{ initialPosition, fee: initialPosition?.fee }}
            currencyInputs={currencyInputs}
            setCurrencyInputs={setCurrencyInputs}
            initialFlowStep={urlState.flowStep}
          >
            <MigrateV3PositionTxContextProvider positionInfo={positionInfo}>
              <FormWrapper
                isMigration
                title={t('common.migrate.position')}
                currentBreadcrumb={
                  <BreadcrumbNavLink to={`/positions/v3/${chainName}/${tokenId}`}>
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
                <MigrateV3Inner
                  positionInfo={positionInfo}
                  currencyInputs={currencyInputs}
                  setCurrencyInputs={setCurrencyInputs}
                />
              </FormWrapper>
            </MigrateV3PositionTxContextProvider>
            <SharedCreateModals />
          </CreateLiquidityContextProvider>
        </LPTransactionSettingsStoreContextProvider>
      </MultichainContextProvider>
    </Trace>
  )
}
