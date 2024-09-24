import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
import {
  CreatePositionContextProvider,
  DEFAULT_POSITION_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  PriceRangeContextProvider,
  useCreatePositionContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { EditRangeSelectionStep, EditSelectTokensStep } from 'pages/Pool/Positions/create/EditStep'
import { SelectPriceRangeStep } from 'pages/Pool/Positions/create/RangeSelectionStep'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Flex, Text } from 'ui/src'
import { AngleRightSmall } from 'ui/src/components/icons/AngleRightSmall'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { Settings } from 'ui/src/components/icons/Settings'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'

function CreatePositionInner() {
  const { step, setStep } = useCreatePositionContext()

  const handleContinue = useCallback(() => {
    setStep((prevStep) => prevStep + 1)
  }, [setStep])

  return (
    <Flex gap="$spacing24">
      {step === PositionFlowStep.SELECT_TOKENS ? (
        <SelectTokensStep onContinue={handleContinue} />
      ) : step === PositionFlowStep.PRICE_RANGE ? (
        <>
          <EditSelectTokensStep />
          <SelectPriceRangeStep onContinue={handleContinue} />
        </>
      ) : (
        <>
          <EditSelectTokensStep />
          <EditRangeSelectionStep />
        </>
      )}
    </Flex>
  )
}

const Sidebar = () => {
  const { t } = useTranslation()
  const { step } = useCreatePositionContext()

  const PoolProgressSteps = [
    { label: t(`position.step.select`), active: step === PositionFlowStep.SELECT_TOKENS },
    { label: t(`position.step.range`), active: step === PositionFlowStep.PRICE_RANGE },
    { label: t(`position.step.deposit`), active: step == PositionFlowStep.DEPOSIT },
  ]

  return (
    <Flex gap={32} width={360}>
      <Flex gap="$gap20">
        <Flex row alignItems="center">
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="pool.positions.title" />
          </Text>
          <AngleRightSmall color="$neutral2" size={iconSizes.icon24} />
        </Flex>
        <Text variant="heading2">
          <Trans i18nKey="position.new" />
        </Text>
      </Flex>
      <PoolProgressIndicator steps={PoolProgressSteps} />
    </Flex>
  )
}

const Toolbar = () => {
  const { setPositionState, setStep } = useCreatePositionContext()
  const { setPriceRangeState } = usePriceRangeContext()

  const handleReset = useCallback(() => {
    setPositionState(DEFAULT_POSITION_STATE)
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
    setStep(PositionFlowStep.SELECT_TOKENS)
  }, [setPositionState, setPriceRangeState, setStep])

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
          <Trans i18nKey="position.protocol" values={{ protocol: 'v4' }} />
        </Text>
        <RotatableChevron direction="down" color="$neutral2" width={iconSizes.icon20} height={iconSizes.icon20} />
      </Button>
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

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (isLoading) {
    return null
  }
  return (
    <CreatePositionContextProvider>
      <PriceRangeContextProvider>
        <Flex row gap={60} justifyContent="space-around" mt="$spacing48">
          <Sidebar />
          <Flex gap={32} width="100%" maxWidth={580}>
            <Toolbar />
            <CreatePositionInner />
          </Flex>
        </Flex>
      </PriceRangeContextProvider>
    </CreatePositionContextProvider>
  )
}
