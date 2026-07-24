import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import {
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from '~/pages/CreatePosition/CreateLiquidityContextProvider'

export interface PoolProgressStep {
  label: string
  active: boolean
  onPress?: () => void
}

/**
 * Builds the progress steps (keyed off {@link PositionFlowStep}) for the create-liquidity flow.
 * Shared between the full create flow (`FormWrapper`) and the merged add-liquidity flow so both
 * render the same steps via `PoolProgressIndicator` / `PoolProgressIndicatorHeader`.
 */
export function usePoolProgressSteps({ isMigration = false }: { isMigration?: boolean } = {}): PoolProgressStep[] {
  const { t } = useTranslation()
  const { step, setStep, creatingPoolOrPair, protocolVersion, setPriceRangeState } = useCreateLiquidityContext()

  return useMemo(() => {
    const createStep = ({
      label,
      stepEnum,
      onPress,
    }: {
      label: string
      stepEnum: PositionFlowStep
      onPress?: () => void
    }): PoolProgressStep => ({
      label,
      active: step === stepEnum,
      // This relies on the ordering of PositionFlowStep enum values matching the actual order in the form.
      onPress: () => {
        onPress?.()

        if (stepEnum < step) {
          setStep(stepEnum)
        }
      },
    })

    if (isMigration) {
      return [
        createStep({ label: t('migrate.selectFeeTier'), stepEnum: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER }),
        createStep({ label: t('migrate.setRange'), stepEnum: PositionFlowStep.PRICE_RANGE }),
      ]
    }

    if (protocolVersion === ProtocolVersion.V2) {
      if (creatingPoolOrPair) {
        return [
          createStep({ label: t('position.step.select'), stepEnum: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER }),
          createStep({ label: t('position.step.price'), stepEnum: PositionFlowStep.PRICE_RANGE }),
        ]
      }
      return [
        createStep({ label: t('position.step.select'), stepEnum: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER }),
        createStep({ label: t('position.step.deposit'), stepEnum: PositionFlowStep.DEPOSIT }),
      ]
    }

    return [
      createStep({
        label: t('position.step.select'),
        stepEnum: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
        onPress: () => setPriceRangeState(DEFAULT_PRICE_RANGE_STATE),
      }),
      createStep({ label: t('position.step.range'), stepEnum: PositionFlowStep.PRICE_RANGE }),
    ]
  }, [creatingPoolOrPair, protocolVersion, setStep, step, t, setPriceRangeState, isMigration])
}
