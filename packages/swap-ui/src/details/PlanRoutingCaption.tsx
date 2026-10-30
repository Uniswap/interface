import { Flex, iconSizes, Text, zIndexes } from '@universe/mycelium'
import { CheckCircleFilled } from '@universe/mycelium/icons/CheckCircleFilled'
import { Shuffle } from '@universe/mycelium/icons/Shuffle'
import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PlanStepLogoKind } from '../types'

/** The adapter passes this as `size` to its currency logos so the badge math below stays in step. */
export const PLAN_STEP_ICON_SIZE = iconSizes.icon20
const halfIconSize = PLAN_STEP_ICON_SIZE / 2
const offset = -halfIconSize / 4

export interface PlanRoutingCaptionProps {
  /** One node per visible plan step, in order. Empty when there are none. */
  stepLogos: ReactNode[]
  /** Connector drawn between consecutive steps; the same element is rendered n-1 times. */
  stepSeparator: ReactNode
}

export function PlanRoutingCaption({ stepLogos, stepSeparator }: PlanRoutingCaptionProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex width="100%" gap="$spacing8">
      <Flex row alignItems="center" width="100%" gap="$spacing8" justifyContent="space-between">
        {stepLogos.map((logo, idx) => (
          <Fragment key={'steplogo-' + idx}>
            <Flex alignItems="center" justifyContent="center">
              {logo}
            </Flex>
            {idx < stepLogos.length - 1 && (
              <Flex flex={1} justifyContent="center">
                {stepSeparator}
              </Flex>
            )}
          </Fragment>
        ))}
      </Flex>
      <Text color="$neutral2" variant="body3">
        {t('swap.details.routingInfo.plan')}
      </Text>
    </Flex>
  )
}

export interface PlanStepLogoProps {
  kind: PlanStepLogoKind
  /** Logo of the step's input token, sized `PLAN_STEP_ICON_SIZE`. */
  inputLogo: ReactNode
  /** Logo of the output token; read for `PlanStepLogoKind.Bridge` only. */
  outputLogo?: ReactNode
}

export function PlanStepLogo({ kind, inputLogo, outputLogo }: PlanStepLogoProps): JSX.Element {
  if (kind === PlanStepLogoKind.Bridge) {
    return (
      <Flex row alignItems="center" gap="$spacing8">
        {inputLogo}
        <Shuffle color="$neutral3" size="$icon.12" />
        {outputLogo}
      </Flex>
    )
  }

  return (
    <Flex>
      {inputLogo}
      <Flex
        bottom={offset}
        position="absolute"
        right={offset}
        zIndex={zIndexes.mask}
        backgroundColor="$background"
        borderRadius="$roundedFull"
      >
        <CheckCircleFilled color="$statusSuccess" size={halfIconSize} />
      </Flex>
    </Flex>
  )
}
