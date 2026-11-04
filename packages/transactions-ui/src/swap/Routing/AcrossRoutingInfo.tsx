import { Flex, Text } from '@universe/mycelium'
import { AcrossLogo } from '@universe/mycelium/logos/AcrossLogo'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface AcrossRoutingRowProps {
  /** Info shell wrapping `<BestRouteLabel wrapped={false} />`. */
  info: ReactNode
  /** Info shell whose trigger is `<AcrossApiLabel />`. */
  apiInfo: ReactNode
}

export function AcrossRoutingRow({ info, apiInfo }: AcrossRoutingRowProps): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      {info}
      {apiInfo}
    </Flex>
  )
}

export function AcrossApiLabel(): JSX.Element {
  return (
    <Flex row shrink justifyContent="flex-end" gap="$spacing6" alignItems="center">
      <AcrossLogo size="$icon.16" />
      <Text color="$neutral1" variant="body3">
        Across API
      </Text>
    </Flex>
  )
}

/** Web tooltip body. The native modal shows the same string through the shell's `caption`, adapter side. */
export function AcrossRoutingCaption(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Text variant="body4" color="$neutral2">
      {t('swap.details.orderRoutingInfo')}
    </Text>
  )
}

export interface AcrossPoweredByProps {
  /** Slot: link to the Across help article. */
  learnMoreLink: ReactNode
  /** Slot: the full Across wordmark (fixed-color svg asset, not portable to the icon factory). */
  logo: ReactNode
}

export function AcrossPoweredBy({ learnMoreLink, logo }: AcrossPoweredByProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered gap="$spacing16">
      {learnMoreLink}
      <Flex row alignItems="center" gap="$spacing6" justifyContent="center">
        <Text color="$neutral3" variant="buttonLabel4">
          {t('swap.details.poweredBy')}
        </Text>
        <Flex>{logo}</Flex>
      </Flex>
    </Flex>
  )
}
