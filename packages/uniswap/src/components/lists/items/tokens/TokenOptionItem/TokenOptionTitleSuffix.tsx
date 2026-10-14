import { Flex } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { RWAIssuerTag } from 'uniswap/src/features/rwa/RWAIssuerTag'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'

/** Token row `titleSuffix`: issuer (logo or dimmed label), then category pill. Undefined when empty so the title stays plain. */
export function tokenOptionTitleSuffix({
  issuer,
  showIssuerTag,
  categoryTag,
}: {
  issuer?: RWAIssuerDisplay
  showIssuerTag?: boolean
  categoryTag?: ReactNode
}): JSX.Element | undefined {
  if (!issuer && !categoryTag) {
    return undefined
  }
  return (
    <>
      {issuer && <RWAIssuerTag issuer={issuer} showLogo={showIssuerTag} />}
      {categoryTag ? <Flex ml="$spacing4">{categoryTag}</Flex> : null}
    </>
  )
}
