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
  DEFAULT_PRICE_RANGE_STATE,
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { DepositStep } from 'pages/Pool/Positions/create/Deposit'
import { EditRangeSelectionStep, EditSelectTokensStep } from 'pages/Pool/Positions/create/EditStep'
import { SelectPriceRangeStep } from 'pages/Pool/Positions/create/RangeSelectionStep'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { useCallback, useMemo } from 'react'
import { ChevronRight } from 'react-feather'
import { Navigate, useParams } from 'react-router-dom'
import { Button, Flex, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { Settings } from 'ui/src/components/icons/Settings'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'

function CreatePositionInner() {
  const {
    positionState: { protocolVersion },
    step,
    setStep,
  } = useCreatePositionContext()
  const v2Selected = protocolVersion === ProtocolVersion.V2

  const handleContinue = useCallback(() => {
    if (v2Selected) {
      setStep(PositionFlowStep.DEPOSIT)
    } else {
      setStep((prevStep) => prevStep + 1)
    }
  }, [setStep, v2Selected])

  return (
    <Flex gap="$spacing24">
      {step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER ? (
        <SelectTokensStep onContinue={handleContinue} />
      ) : step === PositionFlowStep.PRICE_RANGE ? (
        <>
          <EditSelectTokensStep />
          <SelectPriceRangeStep onContinue={handleContinue} />
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
    step,
  } = useCreatePositionContext()

  const PoolProgressSteps = useMemo(() => {
    if (protocolVersion === ProtocolVersion.V2) {
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
  }, [protocolVersion, step, t])

  return (
    <Flex gap={32} width={360}>
      <Flex gap="$gap20">
        <BreadcrumbNavContainer aria-label="breadcrumb-nav">
          <BreadcrumbNavLink to="/positions">
            <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
          </BreadcrumbNavLink>
        </BreadcrumbNavContainer>
        <Text variant="heading2">
          <Trans i18nKey="position.new" />
        </Text>
      </Flex>
      <PoolProgressIndicator steps={PoolProgressSteps} />
    </Flex>
  )
}

const Toolbar = () => {
  const {
    positionState: { protocolVersion },
    setPositionState,
    setStep,
  } = useCreatePositionContext()
  const { setPriceRangeState } = usePriceRangeContext()
  const { setDepositState } = useDepositContext()

  const handleReset = useCallback(() => {
    setPositionState(DEFAULT_POSITION_STATE)
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
    setDepositState(DEFAULT_DEPOSIT_STATE)
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [setDepositState, setPositionState, setPriceRangeState, setStep])

  const handleVersionChange = useCallback(
    (version: ProtocolVersion) => {
      setPositionState((prevState) => ({
        ...DEFAULT_POSITION_STATE,
        currencyInputs: prevState.currencyInputs,
        protocolVersion: version,
      }))
      setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
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
    <Flex flexDirection="row-reverse" alignItems="flex-end" height={88} gap="$gap8">
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
          buttonPaddingY: '$none',
        }}
      >
        <Button
          theme="tertiary"
          py={6}
          pl="$spacing12"
          pr="$spacing8"
          alignItems="center"
          backgroundColor="$surface1"
          borderRadius="$rounded12"
          borderColor="$surface3"
          borderWidth="$spacing1"
          gap={6}
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

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (isLoading) {
    return null
  }
  return (
    <CreatePositionContextProvider
      initialState={{
        protocolVersion: parseProtocolVersion(protocolVersion) ?? ProtocolVersion.V4,
      }}
    >
      <PriceRangeContextProvider>
        <DepositContextProvider>
          <CreateTxContextProvider>
            <Flex row gap={60} justifyContent="space-around" mt="$spacing48">
              <Sidebar />
              <Flex gap={32} width="100%" maxWidth={580}>
                <Toolbar />
                <CreatePositionInner />
              </Flex>
            </Flex>
          </CreateTxContextProvider>
        </DepositContextProvider>
      </PriceRangeContextProvider>
    </CreatePositionContextProvider>
  )
}
