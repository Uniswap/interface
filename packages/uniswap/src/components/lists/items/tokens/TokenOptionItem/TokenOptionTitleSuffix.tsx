import { Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { formatIssuerLabel } from 'uniswap/src/data/apiClients/dataApiService/rwa/formatIssuerDisplaySymbol'
import { RWAIssuerTag } from 'uniswap/src/features/rwa/RWAIssuerTag'
import type { RWAIssuer } from 'uniswap/src/features/rwa/types'

/** Token row `titleSuffix`: issuer (tag or dimmed label), then category pill. Undefined when empty so the title stays plain. */
export function tokenOptionTitleSuffix({
  issuer,
  showIssuerTag,
  categoryTag,
}: {
  issuer?: RWAIssuer
  showIssuerTag?: boolean
  categoryTag?: ReactNode
}): JSX.Element | undefined {
  if (!issuer && !categoryTag) {
    return undefined
  }
  return (
    <>
      {issuer &&
        (showIssuerTag ? (
          <RWAIssuerTag issuer={issuer} />
        ) : (
          <Text variant="body3" color="$neutral3" numberOfLines={1} flexShrink={0}>
            {formatIssuerLabel(issuer)}
          </Text>
        ))}
      {categoryTag}
    </>
  )
}
