import { stringify } from 'qs'
import React, { useMemo } from 'react'
import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'

import useParsedQueryString from '../../hooks/useParsedQueryString'
import useToggledVersion, { DEFAULT_VERSION, Version } from '../../hooks/useToggledVersion'
import { TYPE } from '../../theme'
import { ButtonPrimary } from '../Button'

import { Zap } from 'react-feather'

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
    <ButtonPrimary
      as={Link}
      to={linkDestination}
      style={{
        width: 'fit-content',
        padding: '.2rem .5rem',
        wordBreak: 'keep-all',
        height: '24px',
        marginLeft: '.25rem',
      }}
    >
      <Zap size={12} style={{ marginRight: '0.25rem' }} />
      <TYPE.small style={{ lineHeight: '120%' }} fontSize={12}>
        {otherTradeNonexistent
          ? `No liquidity! Click to trade with ${version.toUpperCase()}`
          : `Get a better price on ${version.toUpperCase()}`}
      </TYPE.small>
    </ButtonPrimary>
  )
}

export function DefaultVersionLink() {
  const location = useLocation()
  const search = useParsedQueryString()
  const version = useToggledVersion()

  const linkDestination = useMemo(() => {
    return {
      ...location,
      search: `?${stringify({
        ...search,
        use: DEFAULT_VERSION,
      })}`,
    }
  }, [location, search])

  return (
    <ButtonPrimary
      as={Link}
      to={linkDestination}
      style={{ width: 'fit-content', marginTop: '4px', padding: '0.5rem 0.5rem' }}
    >
      Showing {version.toUpperCase()} price. <b>Switch to Uniswap {DEFAULT_VERSION.toUpperCase()} ↗</b>
    </ButtonPrimary>
  )
}
