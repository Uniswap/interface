import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { DropdownSelector } from 'components/DropdownSelector'
import { ErrorCallout } from 'components/ErrorCallout'
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
import { EditSelectTokensStep } from 'pages/Pool/Positions/create/EditStep'
import { SelectPriceRangeStep, SelectPriceRangeStepV2 } from 'pages/Pool/Positions/create/RangeSelectionStep'
import ResetCreatePositionFormModal from 'pages/Pool/Positions/create/ResetCreatePositionsFormModal'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { useInitialPoolInputs } from 'pages/Pool/Positions/create/hooks'
import { Container } from 'pages/Pool/Positions/create/shared'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { PositionField } from 'types/position'
import { Button, Flex, Text, TouchableArea, styled, useMedia } from 'ui/src'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal, SectionName } from 'uniswap/src/features/telemetry/constants'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/settings/slice'
import { SwapFormSettings } from 'uniswap/src/features/transactions/swap/form/SwapFormSettings'
import { Deadline } from 'uniswap/src/features/transactions/swap/settings/configs/Deadline'
import { usePrevious } from 'utilities/src/react/hooks'

const WIDTH = {
  positionCard: 600,
  sidebar: 360,
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
      </Trace>
    )
  }

  if (step === PositionFlowStep.PRICE_RANGE) {
    return (
      <Trace logImpression section={SectionName.CreatePositionPriceRangeStep}>
        <EditSelectTokensStep />
        <Container>
          {v2Selected ? <SelectPriceRangeStepV2 /> : <SelectPriceRangeStep />}
          <DepositStep />
          <ErrorCallout errorMessage={error} onPress={refetch} />
        </Container>
      </Trace>
    )
  }

  return (
    <Trace logImpression section={SectionName.CreatePositionDepositStep}>
      <EditSelectTokensStep />
      <Container>
        <DepositStep />
      </Container>
      <ErrorCallout errorMessage={error} onPress={refetch} />
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
    ]
  }, [creatingPoolOrPair, protocolVersion, setStep, step, t])

  return (
    <Flex
      width={WIDTH.sidebar}
      alignSelf="flex-start"
      $platform-web={{ position: 'sticky', top: INTERFACE_NAV_HEIGHT + 25 }}
    >
      <PoolProgressIndicator steps={PoolProgressSteps} />
    </Flex>
  )
}

interface ResetProps {
  onClickReset: () => void
  isDisabled: boolean
}

const ResetButton = ({ onClickReset, isDisabled }: ResetProps) => {
  const { t } = useTranslation()
  return (
    <Button size="small" emphasis="tertiary" onPress={onClickReset} isDisabled={isDisabled} icon={<RotateLeft />}>
      {t('common.button.reset')}
    </Button>
  )
}

const ToolbarContainer = styled(Flex, {
  row: true,
  centered: true,
  gap: '$gap8',
  $md: {
    '$platform-web': {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto',
      gridColumnGap: '8px',
    },
  },
})

const Toolbar = ({
  defaultInitialToken,
  isV4DataEnabled,
}: {
  defaultInitialToken: Currency
  isV4DataEnabled: boolean
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { positionState, setPositionState, setStep, reset: resetCreatePositionState } = useCreatePositionContext()
  const { protocolVersion } = positionState
  const { setPriceRangeState } = usePriceRangeContext()
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false)

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
      setVersionDropdownOpen(false)
    },
    [setPositionState, setPriceRangeState, setStep, navigate, setVersionDropdownOpen],
  )

  const versionOptions = useMemo(
    () =>
      (isV4DataEnabled
        ? [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]
        : [ProtocolVersion.V3, ProtocolVersion.V2]
      )
        .filter((version) => version != protocolVersion)
        .map((version) => (
          <TouchableArea key={`version-${version}`} onPress={() => handleVersionChange(version)}>
            <Flex p="$spacing8" borderRadius="$rounded8" hoverStyle={{ backgroundColor: '$surface2' }}>
              <Text variant="body2">{t('position.new.protocol', { protocol: getProtocolVersionLabel(version) })}</Text>
            </Flex>
          </TouchableArea>
        )),
    [handleVersionChange, protocolVersion, isV4DataEnabled, t],
  )

  return (
    <Flex>
      <ResetCreatePositionFormModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onHandleReset={handleReset}
      />

      <ToolbarContainer>
        <ResetButton onClickReset={() => setShowResetModal(true)} isDisabled={isFormUnchanged} />
        <DropdownSelector
          containerStyle={{ width: 'auto' }}
          buttonStyle={{ py: '$spacing8', px: '$spacing12' }}
          dropdownStyle={{ width: 200, borderRadius: '$rounded16' }}
          menuLabel={
            <Text variant="buttonLabel3" lineHeight="16px">
              {t('position.protocol', { protocol: getProtocolVersionLabel(protocolVersion) })}
            </Text>
          }
          isOpen={versionDropdownOpen}
          toggleOpen={() => setVersionDropdownOpen(!versionDropdownOpen)}
          alignRight
        >
          {versionOptions}
        </DropdownSelector>
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
      </ToolbarContainer>
    </Flex>
  )
}

export default function CreatePosition() {
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)
  const media = useMedia()
  const { t } = useTranslation()

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
                  <Flex
                    mt="$spacing24"
                    width="100%"
                    px="$spacing40"
                    maxWidth={WIDTH.positionCard + WIDTH.sidebar + 80}
                    $xl={{
                      px: '$spacing12',
                      maxWidth: WIDTH.positionCard,
                      mx: 'auto',
                    }}
                  >
                    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
                      <BreadcrumbNavLink to="/positions">
                        {t('pool.positions.title')} <ChevronRight size={14} />
                      </BreadcrumbNavLink>
                      <BreadcrumbNavLink to="/positions/create">{t('pool.newPosition.title')}</BreadcrumbNavLink>
                    </BreadcrumbNavContainer>
                    <Flex
                      row
                      alignSelf="flex-end"
                      alignItems="center"
                      gap="$gap20"
                      width="100%"
                      justifyContent="space-between"
                      mr="auto"
                      mb="$spacing32"
                      $md={{ flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      <Text variant="heading2">{t('position.new')}</Text>
                      <Toolbar
                        defaultInitialToken={initialInputs[PositionField.TOKEN0]}
                        isV4DataEnabled={isV4DataEnabled}
                      />
                    </Flex>
                    <Flex row gap="$spacing20" justifyContent="space-between" width="100%">
                      {!media.xl && <Sidebar />}
                      <Flex gap="$spacing24" flex={1} maxWidth={WIDTH.positionCard} mb="$spacing28">
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
