import { Flex, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface RoutingInfoRowProps {
  /** Left: the adapter's info shell wrapping a `BestRouteLabel`. */
  info: ReactNode
  /** Right: the routing label, which stays in packages/uniswap (animated UniswapX icon). */
  label: ReactNode
}

export function RoutingInfoRow({ info, label }: RoutingInfoRowProps): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      {info}
      <Flex row shrink justifyContent="flex-end">
        {label}
      </Flex>
    </Flex>
  )
}

export interface BestRouteLabelProps {
  /** The hop and plan rows wrap the text in a centered row; the Across row renders the bare text. Parity knob. */
  wrapped?: boolean
}

export function BestRouteLabel({ wrapped = true }: BestRouteLabelProps): JSX.Element {
  const { t } = useTranslation()
  const text = (
    <Text color="$neutral2" variant="body3">
      {t('common.bestRoute')}
    </Text>
  )

  return wrapped ? (
    <Flex centered row gap="$spacing4">
      {text}
    </Flex>
  ) : (
    text
  )
}
