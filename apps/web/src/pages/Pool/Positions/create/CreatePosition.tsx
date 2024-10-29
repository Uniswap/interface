/* eslint-disable-next-line no-restricted-imports */
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { getProtocolVersionLabel, parseProtocolVersion } from 'components/Liquidity/utils'
import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
import { useAccount } from 'hooks/useAccount'
import {
  CreatePositionContextProvider,
  CreateTxContextProvider,
  DepositContextProvider,
  PriceRangeContextProvider,
} from 'pages/Pool/Positions/create/ContextProviders'
import {
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE_POOL_EXISTS,
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { DepositStep } from 'pages/Pool/Positions/create/Deposit'
import { EditRangeSelectionStep, EditSelectTokensStep } from 'pages/Pool/Positions/create/EditStep'
import { SelectPriceRangeStep, SelectPriceRangeStepV2 } from 'pages/Pool/Positions/create/RangeSelectionStep'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { useCallback, useMemo } from 'react'
import { ChevronRight } from 'react-feather'
import { Navigate, useParams } from 'react-router-dom'
import { PositionField } from 'types/position'
import { Button, Flex, Text, useMedia } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { Settings } from 'ui/src/components/icons/Settings'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'

function CreatePositionInner() {
  const {
    positionState: { protocolVersion },
    derivedPositionInfo: { creatingPoolOrPair },
    step,
    setStep,
  } = useCreatePositionContext()
  const v2Selected = protocolVersion === ProtocolVersion.V2

  const handleContinue = useCallback(() => {
    if (v2Selected) {
      if (step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER && creatingPoolOrPair) {
        setStep(PositionFlowStep.PRICE_RANGE)
      } else {
        setStep(PositionFlowStep.DEPOSIT)
      }
    } else {
      setStep((prevStep) => prevStep + 1)
    }
  }, [creatingPoolOrPair, setStep, step, v2Selected])

  return (
    <Flex gap="$spacing24" maxWidth="calc(min(580px, 90vw))">
      {step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER ? (
        <SelectTokensStep onContinue={handleContinue} />
      ) : step === PositionFlowStep.PRICE_RANGE ? (
        <>
          <EditSelectTokensStep />
          {v2Selected ? (
            <SelectPriceRangeStepV2 onContinue={handleContinue} />
          ) : (
            <SelectPriceRangeStep onContinue={handleContinue} />
          )}
        </>
      ) : (
        <>
          <EditSelectTokensStep />
          {!v2Selected && <EditRangeSelectionStep />}
          <DepositStep />
        </>
      )}
    </Flex>
  )
}

const Sidebar = () => {
  const { t } = useTranslation()
  const {
    positionState: { protocolVersion },
    derivedPositionInfo: { creatingPoolOrPair },
    step,
  } = useCreatePositionContext()

  const PoolProgressSteps = useMemo(() => {
    if (protocolVersion === ProtocolVersion.V2) {
      if (creatingPoolOrPair) {
        return [
          { label: t(`position.step.select`), active: step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER },
          { label: t(`position.step.price`), active: step === PositionFlowStep.PRICE_RANGE },
          { label: t(`position.step.deposit`), active: step == PositionFlowStep.DEPOSIT },
        ]
      }

      return [
        { label: t(`position.step.select`), active: step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER },
        { label: t(`position.step.deposit`), active: step == PositionFlowStep.DEPOSIT },
      ]
    }

    return [
      { label: t(`position.step.select`), active: step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER },
      { label: t(`position.step.range`), active: step === PositionFlowStep.PRICE_RANGE },
      { label: t(`position.step.deposit`), active: step == PositionFlowStep.DEPOSIT },
    ]
  }, [creatingPoolOrPair, protocolVersion, step, t])

  return (
    <Flex width={360}>
      <PoolProgressIndicator steps={PoolProgressSteps} />
    </Flex>
  )
}

const Toolbar = () => {
  const { positionState, setPositionState, setStep } = useCreatePositionContext()
  const { protocolVersion } = positionState
  const { priceRangeState, setPriceRangeState } = usePriceRangeContext()
  const { depositState, setDepositState } = useDepositContext()

  const isFormUnchanged = useMemo(() => {
    // Check if all form fields (except protocol version) are set to their default values
    return (
      positionState.currencyInputs === DEFAULT_POSITION_STATE.currencyInputs &&
      positionState.fee === DEFAULT_POSITION_STATE.fee &&
      positionState.hook === DEFAULT_POSITION_STATE.hook &&
      priceRangeState.initialPrice === DEFAULT_PRICE_RANGE_STATE_POOL_EXISTS.initialPrice &&
      depositState === DEFAULT_DEPOSIT_STATE
    )
  }, [positionState.currencyInputs, positionState.fee, positionState.hook, priceRangeState, depositState])

  const handleReset = useCallback(() => {
    setPositionState({ ...DEFAULT_POSITION_STATE, protocolVersion })
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE_POOL_EXISTS)
    setDepositState(DEFAULT_DEPOSIT_STATE)
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [protocolVersion, setDepositState, setPositionState, setPriceRangeState, setStep])

  const handleVersionChange = useCallback(
    (version: ProtocolVersion) => {
      setPositionState((prevState) => ({
        ...DEFAULT_POSITION_STATE,
        currencyInputs: prevState.currencyInputs,
        protocolVersion: version,
      }))
      setPriceRangeState(DEFAULT_PRICE_RANGE_STATE_POOL_EXISTS)
      setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
    },
    [setPositionState, setPriceRangeState, setStep],
  )

  const versionOptions = useMemo(
    () =>
      [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]
        .filter((version) => version != protocolVersion)
        .map((version) => ({
          key: `version-${version}`,
          onPress: () => handleVersionChange(version),
          render: () => (
            <Flex p="$spacing8">
              <Text variant="body2">
                <Trans
                  i18nKey="position.new.protocol"
                  values={{ protocol: getProtocolVersionLabel(version)?.toLowerCase() }}
                />
              </Text>
            </Flex>
          ),
        })),
    [handleVersionChange, protocolVersion],
  )

  return (
    <Flex flexDirection="row-reverse" gap="$gap8" centered>
      <Button
        theme="tertiary"
        py="$spacing8"
        px="$spacing12"
        backgroundColor="$surface1"
        borderRadius="$rounded12"
        borderColor="$surface3"
        borderWidth="$spacing1"
        gap="$gap4"
      >
        <Settings size={iconSizes.icon16} color="$neutral1" />
      </Button>
      <ActionSheetDropdown
        options={versionOptions}
        showArrow={false}
        closeOnSelect={true}
        styles={{
          dropdownMinWidth: 200,
          buttonPaddingY: '$none',
        }}
      >
        <Button
          theme="tertiary"
          py="$spacing6"
          pl="$spacing12"
          pr="$spacing8"
          alignItems="center"
          backgroundColor="$surface1"
          borderRadius="$rounded12"
          borderColor="$surface3"
          borderWidth="$spacing1"
          gap="$gap4"
        >
          <Text variant="buttonLabel4">
            <Trans
              i18nKey="position.protocol"
              values={{ protocol: getProtocolVersionLabel(protocolVersion)?.toLowerCase() }}
            />
          </Text>
          <RotatableChevron direction="down" color="$neutral2" width={iconSizes.icon20} height={iconSizes.icon20} />
        </Button>
      </ActionSheetDropdown>
      <Button
        theme="tertiary"
        py="$spacing8"
        px="$spacing12"
        backgroundColor="$surface1"
        borderRadius="$rounded12"
        borderColor="$surface3"
        borderWidth="$spacing1"
        gap="$gap4"
        onPress={handleReset}
        disabled={isFormUnchanged}
      >
        <RotateLeft size={iconSizes.icon16} color="$neutral1" />
        <Text variant="buttonLabel4">
          <Trans i18nKey="common.button.reset" />
        </Text>
      </Button>
    </Flex>
  )
}

export function CreatePosition() {
  const { value: v4Enabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)
  const { protocolVersion } = useParams<{ protocolVersion: string }>()
  const account = useAccount()
  const media = useMedia()

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (isLoading) {
    return null
  }
  return (
    <CreatePositionContextProvider
      initialState={{
        currencyInputs: {
          [PositionField.TOKEN0]: nativeOnChain(account.chainId ?? UniverseChainId.Mainnet),
        },
        protocolVersion: parseProtocolVersion(protocolVersion) ?? ProtocolVersion.V4,
      }}
    >
      <PriceRangeContextProvider>
        <DepositContextProvider>
          <CreateTxContextProvider>
            <Flex gap={32} mt="$spacing48">
              <BreadcrumbNavContainer aria-label="breadcrumb-nav">
                <BreadcrumbNavLink to="/positions">
                  <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
                </BreadcrumbNavLink>
                <BreadcrumbNavLink to="/positions/create">
                  <Trans i18nKey="pool.newPosition.title" /> <ChevronRight size={14} />
                </BreadcrumbNavLink>
              </BreadcrumbNavContainer>
              <Flex
                row
                alignItems="flex-start"
                gap="$gap20"
                width="100%"
                justifyContent="space-between"
                $lg={{ row: false }}
              >
                <Text variant="heading2">
                  <Trans i18nKey="position.new" />
                </Text>
                <Toolbar />
              </Flex>
              <Flex row gap={32} width="100%">
                {!media.xl && <Sidebar />}
                <CreatePositionInner />
              </Flex>
            </Flex>
          </CreateTxContextProvider>
        </DepositContextProvider>
      </PriceRangeContextProvider>
    </CreatePositionContextProvider>
  )
}
