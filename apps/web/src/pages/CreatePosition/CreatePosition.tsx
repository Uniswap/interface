import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { parseRestProtocolVersion } from '@universe/api'
import { Dropdown } from 'components/Dropdowns/Dropdown'
import { DynamicFeeTierSpeedbump } from 'components/Liquidity/Create/DynamicFeeTierSpeedbump'
import { FormStepsWrapper, FormWrapper } from 'components/Liquidity/Create/FormWrapper'
import { useLiquidityUrlState } from 'components/Liquidity/Create/hooks/useLiquidityUrlState'
import { useLPSlippageValue } from 'components/Liquidity/Create/hooks/useLPSlippageValues'
import ResetCreatePositionFormModal from 'components/Liquidity/Create/ResetCreatePositionsFormModal'
import { DEFAULT_POSITION_STATE, PositionFlowStep } from 'components/Liquidity/Create/types'
import { FeeTierSearchModal } from 'components/Liquidity/FeeTierSearchModal'
import { getProtocolVersionLabel } from 'components/Liquidity/utils/protocolVersion'
import { LPSettings } from 'components/LPSettings'
import {
  CreateLiquidityContextProvider,
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { CreatePositionTxContextProvider } from 'pages/CreatePosition/CreatePositionTxContext'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { Button, Flex, styled, Text, TouchableArea } from 'ui/src'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { Deadline } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/Deadline/Deadline'
import { Slippage } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/Slippage/Slippage'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { usePrevious } from 'utilities/src/react/hooks'

function CreatePositionInner({
  currencyInputs,
  setCurrencyInputs,
}: {
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  const {
    positionState: { protocolVersion },
    creatingPoolOrPair,
    step,
    setStep,
  } = useCreateLiquidityContext()
  const v2Selected = protocolVersion === ProtocolVersion.V2

  const handleContinue = useCallback(() => {
    if (v2Selected) {
      if (step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER && creatingPoolOrPair) {
        setStep(PositionFlowStep.PRICE_RANGE)
      } else {
        setStep(PositionFlowStep.DEPOSIT)
      }
    } else {
      setStep(step + 1)
    }
  }, [creatingPoolOrPair, step, v2Selected, setStep])

  return (
    <FormStepsWrapper
      currencyInputs={currencyInputs}
      setCurrencyInputs={setCurrencyInputs}
      onSelectTokensContinue={handleContinue}
    />
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

const Toolbar = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    isNativeTokenAOnly,
    positionState,
    setPositionState,
    setStep,
    reset: resetCreatePositionState,
    setPriceRangeState,
    resetPriceRange: resetPriceRangeState,
    resetDeposit: resetDepositState,
  } = useCreateLiquidityContext()
  const { protocolVersion } = positionState
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false)

  const [showResetModal, setShowResetModal] = useState(false)

  const { reset: resetMultichainState } = useMultichainContext()

  const { isTestnetModeEnabled } = useEnabledChains()
  const prevIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled) ?? false

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
        // Ensure useLiquidityUrlState is synced
        setTimeout(() => navigate(`/positions/create/${versionUrl}`), 1)
      }

      setPositionState({
        ...DEFAULT_POSITION_STATE,
        protocolVersion: version,
      })
      setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
      setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
      setVersionDropdownOpen(false)
    },
    [setPositionState, setPriceRangeState, setStep, navigate],
  )

  const versionOptions = useMemo(
    () =>
      [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]
        .filter((version) => version !== protocolVersion)
        .map((version) => (
          <TouchableArea key={`version-${version}`} onPress={() => handleVersionChange(version)}>
            <Flex p="$spacing8" borderRadius="$rounded8" hoverStyle={{ backgroundColor: '$surface2' }}>
              <Text variant="body2">{t('position.new.protocol', { protocol: getProtocolVersionLabel(version) })}</Text>
            </Flex>
          </TouchableArea>
        )),
    [handleVersionChange, protocolVersion, t],
  )

  return (
    <Flex>
      <ResetCreatePositionFormModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onHandleReset={handleReset}
      />

      <ToolbarContainer>
        <ResetButton onClickReset={() => setShowResetModal(true)} isDisabled={isNativeTokenAOnly} />
        <Dropdown
          containerStyle={{ width: 'auto' }}
          buttonStyle={{ py: '$spacing8', px: '$spacing12' }}
          dropdownStyle={{ width: 200, borderRadius: '$rounded16' }}
          menuLabel={
            <Text variant="buttonLabel3" lineHeight="16px" whiteSpace="nowrap">
              {t('position.protocol', { protocol: getProtocolVersionLabel(protocolVersion) })}
            </Text>
          }
          isOpen={versionDropdownOpen}
          toggleOpen={() => setVersionDropdownOpen(!versionDropdownOpen)}
          alignRight
        >
          {versionOptions}
        </Dropdown>
        <Flex
          borderRadius="$rounded12"
          borderWidth={!customSlippageTolerance ? '$spacing1' : '$none'}
          borderColor="$surface3"
          height="38px"
          px={!customSlippageTolerance ? '$gap8' : '$gap4'}
          alignItems="center"
          pt="$spacing2"
        >
          <LPSettings
            position="relative"
            adjustRightAlignment={false}
            adjustTopAlignment={false}
            settings={[Slippage, Deadline]}
            iconColor="$neutral1"
            iconSize="$icon.16"
          />
        </Flex>
      </ToolbarContainer>
    </Flex>
  )
}

export const SharedCreateModals = () => {
  return (
    <>
      <FeeTierSearchModal />
      <DynamicFeeTierSpeedbump />
    </>
  )
}

function CreatePositionContent({
  initialInputs,
  paramsProtocolVersion,
  autoSlippageTolerance,
}: {
  initialInputs: ReturnType<typeof useLiquidityUrlState>
  paramsProtocolVersion: ProtocolVersion | undefined
  autoSlippageTolerance: number
}) {
  const initialProtocolVersion = paramsProtocolVersion ?? ProtocolVersion.V4

  const [currencyInputs, setCurrencyInputs] = useState<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>({
    tokenA: initialInputs.tokenA,
    tokenB: initialInputs.tokenB,
  })

  return (
    <Trace logImpression page={InterfacePageName.CreatePosition}>
      <MultichainContextProvider initialChainId={initialInputs.chainId}>
        <LPTransactionSettingsStoreContextProvider autoSlippageTolerance={autoSlippageTolerance}>
          <CreateLiquidityContextProvider
            currencyInputs={currencyInputs}
            setCurrencyInputs={setCurrencyInputs}
            initialPositionState={{
              fee: initialInputs.fee ?? undefined,
              hook: initialInputs.hook ?? undefined,
              protocolVersion: initialProtocolVersion,
            }}
            defaultInitialToken={initialInputs.defaultInitialToken}
            initialPriceRangeState={initialInputs.priceRangeState}
            initialDepositState={initialInputs.depositState}
            initialFlowStep={initialInputs.flowStep}
          >
            <CreatePositionTxContextProvider>
              <FormWrapper toolbar={<Toolbar />}>
                <CreatePositionInner currencyInputs={currencyInputs} setCurrencyInputs={setCurrencyInputs} />
              </FormWrapper>
              <SharedCreateModals />
            </CreatePositionTxContextProvider>
          </CreateLiquidityContextProvider>
        </LPTransactionSettingsStoreContextProvider>
      </MultichainContextProvider>
    </Trace>
  )
}

export default function CreatePosition() {
  // URL format is `/positions/create/:protocolVersion`, with possible searchParams `?currencyA=...&currencyB=...&chain=...&feeTier=...&hook=...`
  const { protocolVersion } = useParams<{
    protocolVersion: string
  }>()
  const paramsProtocolVersion = parseRestProtocolVersion(protocolVersion)

  const autoSlippageTolerance = useLPSlippageValue({
    version: paramsProtocolVersion,
  })

  const initialInputs = useLiquidityUrlState()

  if (initialInputs.loading) {
    return null
  }

  return (
    <CreatePositionContent
      initialInputs={initialInputs}
      paramsProtocolVersion={paramsProtocolVersion}
      autoSlippageTolerance={autoSlippageTolerance}
    />
  )
}
