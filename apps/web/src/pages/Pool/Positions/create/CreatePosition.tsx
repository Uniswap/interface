/* eslint-disable-next-line no-restricted-imports */
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
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
  useCreateTxContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { DepositStep } from 'pages/Pool/Positions/create/Deposit'
import { EditRangeSelectionStep, EditSelectTokensStep } from 'pages/Pool/Positions/create/EditStep'
import { SelectPriceRangeStep, SelectPriceRangeStepV2 } from 'pages/Pool/Positions/create/RangeSelectionStep'
import ResetCreatePositionFormModal from 'pages/Pool/Positions/create/ResetCreatePositionsFormModal'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { TradingAPIError } from 'pages/Pool/Positions/create/TradingAPIError'
import { useInitialPoolInputs } from 'pages/Pool/Positions/create/hooks'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { PositionField } from 'types/position'
import { DeprecatedButton, Flex, Text, useMedia } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag, useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal, SectionName } from 'uniswap/src/features/telemetry/constants'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/settings/slice'
import { SwapFormSettings } from 'uniswap/src/features/transactions/swap/form/SwapFormSettings'
import { Deadline } from 'uniswap/src/features/transactions/swap/settings/configs/Deadline'
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
      borderWidth="$spacing1"
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
  const { error, refetch } = useCreateTxContext()

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
      <TradingAPIError errorMessage={error} refetch={refetch} />
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
    <Flex width={360} alignSelf="flex-start" $platform-web={{ position: 'sticky', top: INTERFACE_NAV_HEIGHT + 25 }}>
      <PoolProgressIndicator steps={PoolProgressSteps} />
    </Flex>
  )
}

interface ResetProps {
  onClickReset: () => void
  isDisabled: boolean
}

const ResetButton = ({ onClickReset, isDisabled }: ResetProps) => {
  return (
    <DeprecatedButton
      theme="tertiary"
      py="10px"
      px="$spacing12"
      backgroundColor="$surface1"
      borderRadius="$rounded12"
      borderColor="$surface3"
      borderWidth="$spacing1"
      gap="$gap4"
      onPress={onClickReset}
      isDisabled={isDisabled}
      flex={1}
    >
      <RotateLeft size={iconSizes.icon16} color="$neutral1" />
      <Text variant="buttonLabel3" lineHeight="16px">
        <Trans i18nKey="common.button.reset" />
      </Text>
    </DeprecatedButton>
  )
}

const Toolbar = ({
  defaultInitialToken,
  isV4DataEnabled,
}: {
  defaultInitialToken: Currency
  isV4DataEnabled: boolean
}) => {
  const navigate = useNavigate()
  const { positionState, setPositionState, setStep, reset: resetCreatePositionState } = useCreatePositionContext()
  const { protocolVersion } = positionState
  const { setPriceRangeState } = usePriceRangeContext()

  const [showResetModal, setShowResetModal] = useState(false)

  const { priceRangeState, reset: resetPriceRangeState } = usePriceRangeContext()
  const { depositState, reset: resetDepositState } = useDepositContext()
  const { reset: resetMultichainState } = useMultichainContext()

  const { isTestnetModeEnabled } = useEnabledChains()
  const prevIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled) ?? false

  const isFormUnchanged = useMemo(() => {
    // Check if all form fields (except protocol version) are set to their default values
    return (
      positionState.currencyInputs.TOKEN0 === defaultInitialToken &&
      !positionState.currencyInputs.TOKEN1 &&
      positionState.fee === DEFAULT_POSITION_STATE.fee &&
      positionState.hook === DEFAULT_POSITION_STATE.hook &&
      priceRangeState.initialPrice === DEFAULT_PRICE_RANGE_STATE.initialPrice &&
      depositState === DEFAULT_DEPOSIT_STATE
    )
  }, [
    positionState.currencyInputs,
    positionState.fee,
    positionState.hook,
    priceRangeState,
    depositState,
    defaultInitialToken,
  ])

  const handleReset = useCallback(() => {
    resetCreatePositionState()
    resetPriceRangeState()
    resetMultichainState()
    resetDepositState()
  }, [resetDepositState, resetCreatePositionState, resetMultichainState, resetPriceRangeState])

  useEffect(() => {
    if (isTestnetModeEnabled !== prevIsTestnetModeEnabled) {
      handleReset()
    }
  }, [handleReset, isTestnetModeEnabled, prevIsTestnetModeEnabled])

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
      setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
      setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
    },
    [setPositionState, setPriceRangeState, setStep, navigate],
  )

  const versionOptions = useMemo(
    () =>
      (isV4DataEnabled
        ? [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]
        : [ProtocolVersion.V3, ProtocolVersion.V2]
      )
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
    [handleVersionChange, protocolVersion, isV4DataEnabled],
  )

  return (
    <Flex flexDirection="row-reverse" gap="$gap8" centered $md={{ justifyContent: 'flex-end' }}>
      <Flex
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        borderColor="$surface3"
        height="38px"
        px="$gap8"
        alignItems="center"
        pt="$spacing2"
      >
        <SwapFormSettings
          position="relative"
          adjustRightAlignment={false}
          adjustTopAlignment={false}
          settings={[Deadline]}
          iconColor="$neutral1"
          iconSize="$icon.16"
        />
      </Flex>
      <ActionSheetDropdown
        options={versionOptions}
        showArrow={false}
        closeOnSelect={true}
        styles={{
          dropdownMinWidth: 200,
          buttonPaddingY: '$none',
        }}
      >
        <Flex
          row
          py="$spacing8"
          px="$spacing12"
          alignItems="center"
          backgroundColor="$surface1"
          borderRadius="$rounded12"
          borderColor="$surface3"
          borderWidth="$spacing1"
          gap="$gap4"
        >
          <Text variant="buttonLabel3" lineHeight="16px">
            <Trans i18nKey="position.protocol" values={{ protocol: getProtocolVersionLabel(protocolVersion) }} />
          </Text>
          <RotatableChevron direction="down" color="$neutral2" width={iconSizes.icon20} height={iconSizes.icon20} />
        </Flex>
      </ActionSheetDropdown>
      <ResetButton onClickReset={() => setShowResetModal(true)} isDisabled={isFormUnchanged} />
      <ResetCreatePositionFormModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onHandleReset={handleReset}
      />
    </Flex>
  )
}

export default function CreatePosition() {
  const { value: lpRedesignEnabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.LPRedesign)
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)
  const media = useMedia()

  // URL format is `/positions/create/:protocolVersion`, with possible searchParams `?currencyA=...&currencyB=...&chain=...`
  const { protocolVersion } = useParams<{ protocolVersion: string }>()
  const paramsProtocolVersion = parseProtocolVersion(protocolVersion)

  const initialInputs = useInitialPoolInputs()
  const initialProtocolVersion = useMemo((): ProtocolVersion => {
    if (isV4DataEnabled) {
      return paramsProtocolVersion ?? ProtocolVersion.V4
    }
    if (!paramsProtocolVersion || paramsProtocolVersion === ProtocolVersion.V4) {
      return ProtocolVersion.V3
    }

    return paramsProtocolVersion
  }, [isV4DataEnabled, paramsProtocolVersion])

  if (!isLoading && !lpRedesignEnabled) {
    return <Navigate to="/pools" replace />
  }

  if (isLoading) {
    return null
  }

  return (
    <Trace logImpression page={InterfacePageNameLocal.CreatePosition}>
      <MultichainContextProvider initialChainId={initialInputs[PositionField.TOKEN0].chainId}>
        <TransactionSettingsContextProvider settingKey={TransactionSettingKey.LP}>
          <CreatePositionContextProvider
            initialState={{
              currencyInputs: initialInputs,
              protocolVersion: initialProtocolVersion,
            }}
          >
            <PriceRangeContextProvider>
              <DepositContextProvider>
                <CreateTxContextProvider>
                  <Flex mt="$spacing24" width="100%" px="$spacing40" maxWidth={1200} $lg={{ px: '$spacing6' }}>
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
                      $md={{ flexDirection: 'column' }}
                    >
                      <Text variant="heading2">
                        <Trans i18nKey="position.new" />
                      </Text>
                      <Toolbar
                        defaultInitialToken={initialInputs[PositionField.TOKEN0]}
                        isV4DataEnabled={isV4DataEnabled}
                      />
                    </Flex>
                    <Flex row gap={80} width="100%">
                      {!media.xl && <Sidebar />}
                      <Flex gap="$spacing24" flex={1} maxWidth={600} mb="$spacing28">
                        <CreatePositionInner />
                      </Flex>
                    </Flex>
                  </Flex>
                </CreateTxContextProvider>
              </DepositContextProvider>
            </PriceRangeContextProvider>
          </CreatePositionContextProvider>
        </TransactionSettingsContextProvider>
      </MultichainContextProvider>
    </Trace>
  )
}
