/* eslint-disable-next-line no-restricted-imports */
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { getProtocolVersionLabel, parseProtocolVersion } from 'components/Liquidity/utils'
import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
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
import { PoolOutOfSyncError } from 'pages/Pool/Positions/create/PoolOutOfSyncError'
import { SelectPriceRangeStep, SelectPriceRangeStepV2 } from 'pages/Pool/Positions/create/RangeSelectionStep'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { useCallback, useMemo } from 'react'
import { ChevronRight } from 'react-feather'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { Button, Flex, Text, useMedia } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { Settings } from 'ui/src/components/icons/Settings'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal, SectionName } from 'uniswap/src/features/telemetry/constants'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { usePrevious } from 'utilities/src/react/hooks'

function CreatingPoolInfo() {
  const { derivedPositionInfo } = useCreatePositionContext()

  const previouslyCreatingPoolOrPair = usePrevious(derivedPositionInfo.creatingPoolOrPair)

  const shouldShowDisabled = previouslyCreatingPoolOrPair && derivedPositionInfo.poolOrPairLoading

  if (!shouldShowDisabled && !derivedPositionInfo.creatingPoolOrPair) {
    return null
  }

  return (
    <Flex
      row
      gap="$spacing12"
      p="$spacing12"
      borderWidth={1}
      borderColor="$surface3"
      borderRadius="$rounded16"
      opacity={shouldShowDisabled ? 0.4 : 1}
    >
      <InfoCircleFilled flexShrink={0} size={iconSizes.icon20} color="$neutral2" />
      <Flex flexWrap="wrap" flexShrink={1} gap="$gap4">
        <Text variant="body3">
          <Trans i18nKey="pool.create" />
        </Text>
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="pool.create.info" />
        </Text>
      </Flex>
    </Flex>
  )
}

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

  if (step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER) {
    return (
      <Trace logImpression section={SectionName.CreatePositionSelectTokensStep}>
        <SelectTokensStep onContinue={handleContinue} />
        <CreatingPoolInfo />
      </Trace>
    )
  }

  if (step === PositionFlowStep.PRICE_RANGE) {
    return (
      <Trace logImpression section={SectionName.CreatePositionPriceRangeStep}>
        <EditSelectTokensStep />
        {v2Selected ? (
          <SelectPriceRangeStepV2 onContinue={handleContinue} />
        ) : (
          <SelectPriceRangeStep onContinue={handleContinue} />
        )}
        <CreatingPoolInfo />
      </Trace>
    )
  }

  return (
    <Trace logImpression section={SectionName.CreatePositionDepositStep}>
      <EditSelectTokensStep />
      {!v2Selected && <EditRangeSelectionStep />}
      <DepositStep />
    </Trace>
  )
}

const Sidebar = () => {
  const { t } = useTranslation()
  const {
    positionState: { protocolVersion },
    derivedPositionInfo: { creatingPoolOrPair },
    step,
    setStep,
  } = useCreatePositionContext()

  const PoolProgressSteps = useMemo(() => {
    const createStep = (label: string, stepEnum: PositionFlowStep) => ({
      label,
      active: step === stepEnum,
      // This relies on the ordering of PositionFlowStep enum values matching the actual order in the form.
      onPress: stepEnum < step ? () => setStep(stepEnum) : undefined,
    })

    if (protocolVersion === ProtocolVersion.V2) {
      if (creatingPoolOrPair) {
        return [
          createStep(t(`position.step.select`), PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER),
          createStep(t('position.step.price'), PositionFlowStep.PRICE_RANGE),
          createStep(t('position.step.deposit'), PositionFlowStep.DEPOSIT),
        ]
      }
      return [
        createStep(t('position.step.select'), PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER),
        createStep(t('position.step.deposit'), PositionFlowStep.DEPOSIT),
      ]
    }

    return [
      createStep(t('position.step.select'), PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER),
      createStep(t('position.step.range'), PositionFlowStep.PRICE_RANGE),
      createStep(t('position.step.deposit'), PositionFlowStep.DEPOSIT),
    ]
  }, [creatingPoolOrPair, protocolVersion, setStep, step, t])

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
  const navigate = useNavigate()

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
      const versionUrl = getProtocolVersionLabel(version)
      if (versionUrl) {
        navigate(`/positions/create/${versionUrl}`)
      }

      setPositionState((prevState) => ({
        ...DEFAULT_POSITION_STATE,
        currencyInputs: prevState.currencyInputs,
        protocolVersion: version,
      }))
      setPriceRangeState(DEFAULT_PRICE_RANGE_STATE_POOL_EXISTS)
      setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
    },
    [setPositionState, setPriceRangeState, setStep, navigate],
  )

  const versionOptions = useMemo(
    () =>
      [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]
        .filter((version) => version != protocolVersion)
        .map((version) => ({
          key: `version-${version}`,
          onPress: () => handleVersionChange(version),
          render: () => (
            <Flex p="$spacing8">
              <Text variant="body2">
                <Trans i18nKey="position.new.protocol" values={{ protocol: getProtocolVersionLabel(version) }} />
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
          <Text variant="buttonLabel3">
            <Trans i18nKey="position.protocol" values={{ protocol: getProtocolVersionLabel(protocolVersion) }} />
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
        <Text variant="buttonLabel3">
          <Trans i18nKey="common.button.reset" />
        </Text>
      </Button>
    </Flex>
  )
}

export function CreatePosition() {
  const { value: v4Enabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)
  const { protocolVersion } = useParams<{ protocolVersion: string }>()
  const media = useMedia()

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (isLoading) {
    return null
  }

  return (
    <Trace logImpression page={InterfacePageNameLocal.CreatePosition}>
      <MultichainContextProvider>
        <CreatePositionContextProvider
          initialState={{
            currencyInputs: DEFAULT_POSITION_STATE.currencyInputs,
            protocolVersion: parseProtocolVersion(protocolVersion) ?? ProtocolVersion.V4,
          }}
        >
          <PriceRangeContextProvider>
            <DepositContextProvider>
              <CreateTxContextProvider>
                <Flex mt="$spacing24" width="100%" px="$spacing40" maxWidth={1200} $lg={{ px: '$spacing20' }}>
                  <BreadcrumbNavContainer aria-label="breadcrumb-nav">
                    <BreadcrumbNavLink to="/positions">
                      <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
                    </BreadcrumbNavLink>
                    <BreadcrumbNavLink to="/positions/create">
                      <Trans i18nKey="pool.newPosition.title" />
                    </BreadcrumbNavLink>
                  </BreadcrumbNavContainer>
                  <Flex
                    row
                    alignSelf="flex-end"
                    gap="$gap20"
                    width="100%"
                    maxWidth={360 + 80 + 600}
                    justifyContent="space-between"
                    mr="auto"
                    mb="$spacing32"
                    $xl={{ maxWidth: 600 }}
                  >
                    <Text variant="heading2">
                      <Trans i18nKey="position.new" />
                    </Text>
                    <Toolbar />
                  </Flex>
                  <Flex row gap={80} width="100%">
                    {!media.xl && <Sidebar />}
                    <Flex gap="$spacing24" flex={1} maxWidth={600} mb="$spacing28">
                      <CreatePositionInner />
                      <PoolOutOfSyncError />
                    </Flex>
                  </Flex>
                </Flex>
              </CreateTxContextProvider>
            </DepositContextProvider>
          </PriceRangeContextProvider>
        </CreatePositionContextProvider>
      </MultichainContextProvider>
    </Trace>
  )
}
