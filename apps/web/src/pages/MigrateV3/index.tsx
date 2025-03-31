import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { ErrorCallout } from 'components/ErrorCallout'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { TokenInfo } from 'components/Liquidity/TokenInfo'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { PositionInfo } from 'components/Liquidity/types'
import { parseRestPosition } from 'components/Liquidity/utils'
import { LoadingRows } from 'components/Loader/styled'
import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
import useSelectChain from 'hooks/useSelectChain'
import { MigrateV3PositionTxContextProvider, useMigrateV3TxContext } from 'pages/MigrateV3/MigrateV3LiquidityTxContext'
import useInitialPosition from 'pages/MigrateV3/hooks/useInitialPosition'
import {
  CreatePositionContextProvider,
  DepositContextProvider,
  PriceRangeContextProvider,
} from 'pages/Pool/Positions/create/ContextProviders'
import {
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { EditSelectTokensStep } from 'pages/Pool/Positions/create/EditStep'
import { SelectPriceRangeStep } from 'pages/Pool/Positions/create/RangeSelectionStep'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { Container } from 'pages/Pool/Positions/create/shared'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { getCurrencyForProtocol } from 'pages/Pool/Positions/create/utils'
import { LoadingRow } from 'pages/Pool/Positions/shared'
import { useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { PositionField } from 'types/position'
import { Flex, Main, Text, styled, useMedia } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme/heights'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal, ModalName } from 'uniswap/src/features/telemetry/constants'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/settings/slice'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { isSameAddress } from 'utilities/src/addresses'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useChainIdFromUrlParam } from 'utils/chainParams'
import { useAccount } from 'wagmi'

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

function MigrateV3Inner({ positionInfo }: { positionInfo: PositionInfo }) {
  const { chainName, tokenId } = useParams<{ tokenId: string; chainName: string }>()
  const trace = useTrace()
  const { t } = useTranslation()

  const { positionState, setPositionState, setStep, step, currentTransactionStep, setCurrentTransactionStep } =
    useCreatePositionContext()
  const { protocolVersion } = positionState
  const { setPriceRangeState } = usePriceRangeContext()
  const { setDepositState } = useDepositContext()
  const isMigrateToV4Enabled = useFeatureFlag(FeatureFlags.MigrateV3ToV4)

  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([])
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId
  const account = useAccountMeta()
  const dispatch = useDispatch()
  const { txInfo, error, refetch } = useMigrateV3TxContext()
  const media = useMedia()
  const navigate = useNavigate()

  const onClose = () => {
    setCurrentTransactionStep(undefined)
  }

  const { currency0Amount, currency1Amount, owner } = positionInfo

  const currency0FiatAmount = useUSDCValue(currency0Amount) ?? undefined
  const currency1FiatAmount = useUSDCValue(currency1Amount) ?? undefined

  if (!isMigrateToV4Enabled || !isSameAddress(account?.address, owner)) {
    navigate('/positions')
  }

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
                protocolVersion,
                currencyInputs: {
                  [PositionField.TOKEN0]: getCurrencyForProtocol(currency0Amount.currency, protocolVersion),
                  [PositionField.TOKEN1]: getCurrencyForProtocol(currency1Amount.currency, protocolVersion),
                },
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
                    onDisableContinue={!txInfo || Boolean(error)}
                    onContinue={() => {
                      const isValidTx = isValidLiquidityTxContext(txInfo)
                      if (!account || account?.type !== AccountType.SignerMnemonic || !isValidTx) {
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
                          onFailure: onClose,
                          analytics: {
                            ...getLPBaseAnalyticsProperties({
                              trace,
                              fee: positionInfo.feeTier,
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
                    }}
                  />
                </Container>
                <Flex mb="$spacing20">
                  <ErrorCallout errorMessage={error} onPress={refetch} />
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </Flex>

      <Modal
        name={ModalName.MigrateLiquidity}
        onClose={onClose}
        isDismissible
        isModalOpen={Boolean(currentTransactionStep)}
      >
        <LiquidityModalHeader title={t('pool.migrateLiquidity')} closeModal={onClose} />
        <Flex gap="$gap16" px="$padding16" my="$spacing8">
          <TokenInfo currencyAmount={currency0Amount} currencyUSDAmount={currency0FiatAmount} isMigrating />
          <Text variant="body3" color="$neutral2">
            {t('common.and')}
          </Text>
          <TokenInfo currencyAmount={currency1Amount} currencyUSDAmount={currency1FiatAmount} isMigrating />
        </Flex>
        <ProgressIndicator steps={transactionSteps} currentStep={currentTransactionStep} />
      </Modal>
    </>
  )
}

/**
 * The page for migrating any v3 LP position to v4.
 */
export default function MigrateV3() {
  const { tokenId } = useParams<{ tokenId: string }>()
  const chainId = useChainIdFromUrlParam()
  const account = useAccount()
  const { data, isLoading: positionLoading } = useGetPositionQuery(
    account.address
      ? {
          owner: account.address,
          protocolVersion: ProtocolVersion.V3,
          tokenId,
          chainId: chainId ?? account.chainId,
        }
      : undefined,
  )

  const position = data?.position

  const positionInfo = useMemo(() => parseRestPosition(position), [position])

  // Need the initial position when migrating out of range positions.
  const initialPosition = useInitialPosition(positionInfo)

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
      page={InterfacePageNameLocal.MigrateV3}
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
        <TransactionSettingsContextProvider settingKey={TransactionSettingKey.LP}>
          <CreatePositionContextProvider
            initialState={{
              initialPosition,
              currencyInputs: {
                [PositionField.TOKEN0]: getCurrencyForProtocol(currency0Amount.currency, ProtocolVersion.V4),
                [PositionField.TOKEN1]: getCurrencyForProtocol(currency1Amount.currency, ProtocolVersion.V4),
              },
            }}
          >
            <PriceRangeContextProvider>
              <DepositContextProvider>
                <MigrateV3PositionTxContextProvider positionInfo={positionInfo}>
                  <MigrateV3Inner positionInfo={positionInfo} />
                </MigrateV3PositionTxContextProvider>
              </DepositContextProvider>
            </PriceRangeContextProvider>
          </CreatePositionContextProvider>
        </TransactionSettingsContextProvider>
      </MultichainContextProvider>
    </Trace>
  )
}
