// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { TokenInfo } from 'components/Liquidity/TokenInfo'
import { PositionInfo } from 'components/Liquidity/types'
import { parseRestPosition } from 'components/Liquidity/utils'
import { LoadingRows } from 'components/Loader/styled'
import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
import { useChainFromUrlParam } from 'constants/chains'
import useSelectChain from 'hooks/useSelectChain'
import { MigrateV3PositionTxContextProvider, useMigrateV3TxContext } from 'pages/MigrateV3/MigrateV3LiquidityTxContext'
import {
  CreatePositionContextProvider,
  DepositContextProvider,
  PriceRangeContextProvider,
} from 'pages/Pool/Positions/create/ContextProviders'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { EditSelectTokensStep } from 'pages/Pool/Positions/create/EditStep'
import { SelectPriceRangeStep } from 'pages/Pool/Positions/create/RangeSelectionStep'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { LoadingRow } from 'pages/Pool/Positions/shared'
import { useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { useDispatch } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { ClickableTamaguiStyle } from 'theme/components'
import { PositionField } from 'types/position'
import { Flex, Main, Text, styled } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { Trans, useTranslation } from 'uniswap/src/i18n'
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
  const { positionId } = useParams<{ positionId: string }>()
  const { t } = useTranslation()

  const { step, setStep } = useCreatePositionContext()
  const { value: v4Enabled, isLoading: isV4GateLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)

  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([])
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId
  const account = useAccountMeta()
  const dispatch = useDispatch()
  const { txInfo } = useMigrateV3TxContext()

  const onClose = () => {
    setCurrentTransactionStep(undefined)
  }

  const { currency0Amount, currency1Amount } = positionInfo
  const currency0FiatAmount = useUSDCValue(currency0Amount) ?? undefined
  const currency1FiatAmount = useUSDCValue(currency1Amount) ?? undefined

  if (!isV4GateLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (isV4GateLoading) {
    return null
  }

  return (
    <BodyWrapper>
      <Flex maxWidth={360}>
        {/* nav breadcrumbs */}
        <Flex width="100%">
          <BreadcrumbNavContainer aria-label="breadcrumb-nav">
            <BreadcrumbNavLink to="/positions">
              <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
            </BreadcrumbNavLink>
            <BreadcrumbNavLink to={`/explore/position/${positionId}`}>
              {currency0Amount.currency.symbol} / {currency1Amount.currency.symbol} <ChevronRight size={14} />
            </BreadcrumbNavLink>
          </BreadcrumbNavContainer>
        </Flex>
        <Text width="100%" variant="heading2" mt="$spacing20">
          <Trans i18nKey="common.migrate.position" />
        </Text>
        <PoolProgressIndicator
          mt="$spacing32"
          steps={[
            { label: t('migrate.selectFeeTier'), active: step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER },
            { label: t('migrate.setRange'), active: step === PositionFlowStep.PRICE_RANGE },
          ]}
        />
      </Flex>
      <Flex flex={3} gap="$gap12">
        <Flex mt={44} row justifyContent="flex-end">
          {/* TODO: replace with Spore button once available */}
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
              setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
            }}
          >
            <RotateLeft color="$neutral1" size={16} />
            <Text variant="buttonLabel4" color="$neutral2">
              <Trans i18nKey="common.button.reset" />
            </Text>
          </Flex>
        </Flex>
        <LiquidityPositionCard liquidityPosition={positionInfo} mt="$spacing24" />
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
          <SelectPriceRangeStep
            width="100%"
            maxWidth="unset"
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
                  onSuccess: onClose,
                  onFailure: onClose,
                }),
              )
            }}
          />
        )}
      </Flex>
      <Modal
        name={ModalName.MigrateLiquidity}
        onClose={onClose}
        isDismissible
        isModalOpen={Boolean(currentTransactionStep)}
      >
        <LiquidityModalHeader title={t('pool.migrateLiquidity')} closeModal={onClose} />
        <Flex gap="$gap16" px="$padding16" my="$spacing8">
          <TokenInfo currencyAmount={currency0Amount} currencyUSDAmount={currency0FiatAmount} />
          <Text variant="body3" color="$neutral2">
            {t('common.and')}
          </Text>
          <TokenInfo currencyAmount={currency1Amount} currencyUSDAmount={currency1FiatAmount} />
        </Flex>
        <ProgressIndicator steps={transactionSteps} currentStep={currentTransactionStep} />
      </Modal>
    </BodyWrapper>
  )
}

/**
 * The page for migrating any v3 LP position to v4.
 */
export default function MigrateV3() {
  const { tokenId } = useParams<{ tokenId: string }>()
  const chainInfo = useChainFromUrlParam()
  const account = useAccount()
  const { data, isLoading: positionLoading } = useGetPositionQuery(
    account.address
      ? {
          owner: account.address,
          protocolVersion: ProtocolVersion.V3,
          tokenId,
          chainId: chainInfo?.id ?? account.chainId,
        }
      : undefined,
  )

  const position = data?.position

  const positionInfo = useMemo(() => parseRestPosition(position), [position])

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

  const { currency0Amount, currency1Amount } = positionInfo
  return (
    <CreatePositionContextProvider
      initialState={{
        currencyInputs: {
          [PositionField.TOKEN0]: currency0Amount.currency,
          [PositionField.TOKEN1]: currency1Amount.currency,
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
  )
}
