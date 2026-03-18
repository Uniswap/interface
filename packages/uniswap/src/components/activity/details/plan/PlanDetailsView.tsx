import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, getTokenValue, Text, VerticalDottedLineSeparator } from 'ui/src'
import { ArrowRight, ArrowRightDashed } from 'ui/src/components/icons'
import { PLAN_STEP_ITEM_WIDTH, PlanStepItem } from 'uniswap/src/components/activity/details/plan/PlanStepItem'
import { ResumePlanButton } from 'uniswap/src/components/activity/details/plan/ResumePlanButton'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useCanResumePlan } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useCanResumePlan'
import { useIntermediaryPlanState } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useIntermediaryPlanState'
import { useIntermediaryPlanStateDescriptor } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useIntermediaryPlanStateDescriptor'
import {
  PlanTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { isWebPlatform } from 'utilities/src/platform'

interface PlanDetailsViewProps {
  isExternalProfile?: boolean
  typeInfo: PlanTransactionInfo
  status: TransactionStatus
  closePlanView: () => void
  onClose: () => void
}

export function PlanDetailsView(props: PlanDetailsViewProps): JSX.Element | null {
  const { onClose, typeInfo, closePlanView, status } = props
  const { t } = useTranslation()
  const canResumePlan = useCanResumePlan(typeInfo, status)

  return (
    <Flex
      centered
      gap="$spacing24"
      pb={isWebPlatform ? '$none' : '$spacing12'}
      px={isWebPlatform ? '$none' : '$spacing24'}
    >
      <PlanDetailsHeader typeInfo={typeInfo} />
      <PlanDetailsStatus {...props} />
      <PlanDetailsSteps typeInfo={typeInfo} />

      <Flex width="100%" gap="$spacing8">
        <Flex row>
          <Button size="medium" emphasis="secondary" onPress={closePlanView}>
            {t('common.button.back')}
          </Button>
        </Flex>
        {canResumePlan && (
          <Flex row>
            <ResumePlanButton typeInfo={typeInfo} onSuccess={onClose} />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

type StepCurrencyInfo = {
  currencyId: string
  completed: boolean
}

function PlanDetailsHeader({ typeInfo }: { typeInfo: PlanTransactionInfo }): JSX.Element {
  const currencyIds = useMemo(() => {
    return typeInfo.stepDetails.reduce<StepCurrencyInfo[]>((arr, curr) => {
      // Hide failed steps, as they will be duplicative
      if (curr.status === TransactionStatus.Failed) {
        return arr
      }
      const hasInputCurrency = arr.length > 0
      const completed = curr.status === TransactionStatus.Success

      // Only add a step's input currency if no input currency has been added yet, to avoid duplication with adjacent steps.
      if (!hasInputCurrency) {
        const inputCurrencyId = extractSwapCurrencyId(curr, 'input')
        if (inputCurrencyId) {
          arr.push({ currencyId: inputCurrencyId, completed })
        }
      }

      const outputCurrencyId = extractSwapCurrencyId(curr, 'output')
      if (outputCurrencyId) {
        arr.push({ currencyId: outputCurrencyId, completed })
      }

      return arr
    }, [])
  }, [typeInfo.stepDetails])

  return (
    <Flex row centered gap="$spacing2" pt="$spacing12">
      {currencyIds.map((currencyInfo, index) => {
        return (
          <Fragment key={`plan-details-header-icon-${currencyInfo.currencyId}`}>
            {index !== 0 && <PlanDetailsHeaderArrow isDashed={!currencyInfo.completed} />}
            <PlanDetailsHeaderIcon currencyId={currencyInfo.currencyId} grayscale={!currencyInfo.completed} />
          </Fragment>
        )
      })}
    </Flex>
  )
}

function PlanDetailsHeaderArrow({ isDashed }: { isDashed: boolean }): JSX.Element {
  return isDashed ? (
    <ArrowRightDashed color="$neutral2" size="$icon.20" />
  ) : (
    <Flex centered height="$spacing20" width="$spacing20">
      <ArrowRight color="$neutral2" size={15} />
    </Flex>
  )
}

function PlanDetailsHeaderIcon({
  currencyId,
  grayscale,
}: {
  currencyId: string
  grayscale: boolean
}): JSX.Element | null {
  const currencyInfo = useCurrencyInfo(currencyId)

  if (!currencyInfo) {
    return null
  }

  return (
    <Flex filter={grayscale ? 'grayscale(1)' : 'none'}>
      <CurrencyLogo hideNetworkLogo currencyInfo={currencyInfo} size={20} />
    </Flex>
  )
}

function PlanDetailsStatus({ typeInfo, status }: Pick<PlanDetailsViewProps, 'typeInfo' | 'status'>): JSX.Element {
  const { t } = useTranslation()
  const intermediaryState = useIntermediaryPlanState({ typeInfo, status })
  const descriptor = useIntermediaryPlanStateDescriptor({ intermediaryState, status, long: true })

  return (
    <Flex centered gap="$spacing8">
      <Text variant="subheading2">{getTransactionSummaryTitle({ typeInfo, status }, t)}</Text>
      <Text variant="body3" color="$neutral2">
        {descriptor}
      </Text>
    </Flex>
  )
}

function PlanDetailsSteps({ typeInfo }: { typeInfo: PlanTransactionInfo }): JSX.Element {
  const visibleSteps = useMemo(
    () => typeInfo.stepDetails.filter((step) => step.typeInfo.type !== TransactionType.Permit2Approve),
    [typeInfo.stepDetails],
  )
  const stepItemWidth = getTokenValue(PLAN_STEP_ITEM_WIDTH)
  const strokeWidth = 2
  const dividerMargin = stepItemWidth / 2 - strokeWidth / 2

  return (
    <Flex
      width="100%"
      gap="$spacing2"
      p="$spacing12"
      backgroundColor="$surface2"
      borderRadius="$rounded20"
      borderColor="$surface3"
      borderWidth="$spacing1"
    >
      {visibleSteps.map((txDetails, index) => (
        <Fragment key={`${txDetails.id}-step-row-${index}`}>
          <PlanStepItem transactionDetails={txDetails} />
          {index < visibleSteps.length - 1 && (
            <Flex height="$spacing12" ml={dividerMargin}>
              <VerticalDottedLineSeparator strokeWidth={strokeWidth} />
            </Flex>
          )}
        </Fragment>
      ))}
    </Flex>
  )
}

function extractSwapCurrencyId(transactionDetails: TransactionDetails, mode: 'input' | 'output'): string | undefined {
  const { typeInfo, chainId } = transactionDetails

  switch (typeInfo.type) {
    case TransactionType.Bridge:
      // Bridge currencies are ignored, to avoid duplication with the adjacent swap step(s).
      return undefined
    case TransactionType.Swap:
      return mode === 'input' ? typeInfo.inputCurrencyId : typeInfo.outputCurrencyId
    case TransactionType.Wrap:
      if (typeInfo.unwrapped) {
        return mode === 'input' ? buildWrappedNativeCurrencyId(chainId) : buildNativeCurrencyId(chainId)
      } else {
        return mode === 'input' ? buildNativeCurrencyId(chainId) : buildWrappedNativeCurrencyId(chainId)
      }
    default:
      return undefined
  }
}
