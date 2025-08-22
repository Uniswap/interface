import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { ErrorCallout } from 'components/ErrorCallout'
import { Container } from 'components/Liquidity/Create/Container'
import { EditSelectTokensStep } from 'components/Liquidity/Create/EditStep'
import { SelectPriceRangeStep } from 'components/Liquidity/Create/RangeSelectionStep'
import { SelectTokensStep } from 'components/Liquidity/Create/SelectTokenStep'
import { useLPSlippageValue } from 'components/Liquidity/Create/hooks/useLPSlippageValues'
import { useLiquidityUrlState } from 'components/Liquidity/Create/hooks/useLiquidityUrlState'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'components/Liquidity/Create/types'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { LoadingRow } from 'components/Liquidity/Loader'
import { TokenInfo } from 'components/Liquidity/TokenInfo'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import type { PositionInfo } from 'components/Liquidity/types'
import { getCurrencyForProtocol } from 'components/Liquidity/utils/currency'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { LoadingRows } from 'components/Loader/styled'
import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import {
  CreateLiquidityContextProvider,
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { SharedCreateModals } from 'pages/CreatePosition/CreatePosition'
import { MigrateV3PositionTxContextProvider, useMigrateV3TxContext } from 'pages/MigrateV3/MigrateV3LiquidityTxContext'
import useInitialPosition from 'pages/MigrateV3/hooks/useInitialPosition'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate, useParams } from 'react-router'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Button, Flex, Main, Text, styled, useMedia } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme/heights'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay } from 'uniswap/src/features/transactions/liquidity/utils'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { isSameAddress } from 'utilities/src/addresses'
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
  initialPosition,
  positionInfo,
  currencyInputs,
  setCurrencyInputs,
}: {
  initialPosition:
    | {
        tickLower: number
        tickUpper: number
        isOutOfRange: boolean
      }
    | undefined
  positionInfo: PositionInfo
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  const { chainName, tokenId } = useParams<{ tokenId: string; chainName: string }>()
  const trace = useTrace()
  const { t } = useTranslation()

  const {
    positionState,
    setPositionState,
    setStep,
    setPriceRangeState,
    setDepositState,
    step,
    currentTransactionStep,
    setCurrentTransactionStep,
  } = useCreateLiquidityContext()
  const { protocolVersion } = positionState

  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([])
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const account = useWallet().evmAccount
  const dispatch = useDispatch()
  const { txInfo, transactionError, refetch, setTransactionError } = useMigrateV3TxContext()
  const media = useMedia()
  const navigate = useNavigate()

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const onClose = useCallback(() => {
    setIsReviewModalOpen(false)
    setTransactionError(false)
  }, [setIsReviewModalOpen, setTransactionError])

  const { currency0Amount, currency1Amount, owner } = positionInfo

  const currency0FiatAmount = useUSDCValue(currency0Amount)
  const currency1FiatAmount = useUSDCValue(currency1Amount)

  if (!isSameAddress(account?.address, owner)) {
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
    setTransactionSteps,
    setTransactionError,
    currency0Amount.currency,
    currency1Amount.currency,
  ])

  return (
    <>
      <Flex mt="$spacing48" gap="$gap36">
        <BreadcrumbNavContainer aria-label="breadcrumb-nav">
          <BreadcrumbNavLink to="/positions">
            <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
          </BreadcrumbNavLink>
          <BreadcrumbNavLink to={`/positions/v3/${chainName}/${tokenId}`}>
            {currency0Amount.currency.symbol} / {currency1Amount.currency.symbol} <ChevronRight size={14} />
          </BreadcrumbNavLink>
        </BreadcrumbNavContainer>
        <Flex row justifyContent="space-between" alignItems="center" gap="$gap20" width="100%">
          <Text width="100%" variant="heading2">
            <Trans i18nKey="common.migrate.position" />
          </Text>
          <Flex
            row
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            alignItems="center"
            justifyContent="center"
            gap="$gap4"
            py="$padding8"
            px="$padding12"
            {...ClickableTamaguiStyle}
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
            <RotateLeft color="$neutral1" size={16} />
            <Text variant="buttonLabel4" color="$neutral2">
              <Trans i18nKey="common.button.reset" />
            </Text>
          </Flex>
        </Flex>
        <Flex row gap={32} width="100%">
          {!media.xl && (
            <Flex
              width={360}
              alignSelf="flex-start"
              $platform-web={{ position: 'sticky', top: INTERFACE_NAV_HEIGHT + 25 }}
            >
              <PoolProgressIndicator
                steps={[
                  { label: t('migrate.selectFeeTier'), active: step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER },
                  { label: t('migrate.setRange'), active: step === PositionFlowStep.PRICE_RANGE },
                ]}
              />
            </Flex>
          )}
          <Flex gap="$gap16" maxWidth="calc(min(580px, 90vw))">
            <LiquidityPositionCard liquidityPosition={positionInfo} disabled />
            <Flex justifyContent="center" alignItems="center">
              <Flex shrink backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12">
                <ArrowDown size={20} color="$neutral1" />
              </Flex>
            </Flex>
            {step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER ? (
              <SelectTokensStep
                width="100%"
                maxWidth="unset"
                tokensLocked
                currencyInputs={currencyInputs}
                setCurrencyInputs={setCurrencyInputs}
                onContinue={() => {
                  setStep(PositionFlowStep.PRICE_RANGE)
                }}
              />
            ) : (
              <EditSelectTokensStep width="100%" maxWidth="unset" />
            )}
            {step === PositionFlowStep.PRICE_RANGE && (
              <>
                <Container width="100%" maxWidth="unset">
                  <SelectPriceRangeStep
                    positionInfo={positionInfo}
                    onDisableContinue={!txInfo || Boolean(transactionError)}
                    onContinue={() => setIsReviewModalOpen(true)}
                  />
                </Container>
                {!isReviewModalOpen && (
                  <Flex mb="$spacing20">
                    <ErrorCallout errorMessage={transactionError} onPress={refetch} />
                  </Flex>
                )}
              </>
            )}
          </Flex>
        </Flex>
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

/**
 * The page for migrating any v3 LP position to v4.
 */
export default function MigrateV3() {
  const { tokenId } = useParams<{ tokenId: string }>()
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
            initialPositionState={{ initialPosition }}
            currencyInputs={currencyInputs}
            setCurrencyInputs={setCurrencyInputs}
            initialFlowStep={urlState.flowStep}
          >
            <MigrateV3PositionTxContextProvider positionInfo={positionInfo}>
              <MigrateV3Inner
                initialPosition={initialPosition}
                positionInfo={positionInfo}
                currencyInputs={currencyInputs}
                setCurrencyInputs={setCurrencyInputs}
              />
            </MigrateV3PositionTxContextProvider>
            <SharedCreateModals />
          </CreateLiquidityContextProvider>
        </LPTransactionSettingsStoreContextProvider>
      </MultichainContextProvider>
    </Trace>
  )
}
