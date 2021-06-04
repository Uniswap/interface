import { stringify } from 'qs'
import React, { useMemo } from 'react'
import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'

import useParsedQueryString from '../../hooks/useParsedQueryString'
import { DEFAULT_VERSION, Version } from '../../hooks/useToggledVersion'
import { HideSmall, TYPE, SmallOnly } from '../../theme'
import { ButtonPrimary } from '../Button'
import styled from 'styled-components/macro'
import { Zap } from 'react-feather'

const ResponsiveButton = styled(ButtonPrimary)`
  width: fit-content;
  padding: 0.2rem 0.5rem;
  word-break: keep-all;
  height: 24px;
  margin-left: 0.75rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 4px;
    border-radius: 8px;
  `};
`

export default function BetterTradeLink({
  version,
  otherTradeNonexistent = false,
}: {
  version: Version
  otherTradeNonexistent: boolean
}) {
  const location = useLocation()
  const search = useParsedQueryString()

  const linkDestination = useMemo(() => {
    return {
      ...location,
      search: `?${stringify({
        ...search,
        use: version !== DEFAULT_VERSION ? version : undefined,
      })}`,
    }
  }, [location, search, version])

  return (
    <ResponsiveButton as={Link} to={linkDestination}>
      <Zap size={12} style={{ marginRight: '0.25rem' }} />
      <HideSmall>
        <TYPE.small style={{ lineHeight: '120%' }} fontSize={12}>
          {otherTradeNonexistent
            ? `No liquidity! Click to trade with ${version.toUpperCase()}`
            : `Get a better price on ${version.toUpperCase()}`}
        </TYPE.small>
      </HideSmall>
      <SmallOnly>
        <TYPE.small style={{ lineHeight: '120%' }} fontSize={12}>
          {otherTradeNonexistent
            ? `No liquidity! Click to trade with ${version.toUpperCase()}`
            : `Better ${version.toUpperCase()} price`}
        </TYPE.small>
      </SmallOnly>
    </ResponsiveButton>
  )
}
