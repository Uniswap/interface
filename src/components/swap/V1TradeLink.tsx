import { stringify } from 'qs'
import React, { useContext, useMemo } from 'react'
import { useLocation } from 'react-router'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import useToggledVersion, { Version } from '../../hooks/useToggledVersion'

import { StyledInternalLink } from '../../theme'
import { YellowCard } from '../Card'
import { AutoColumn } from '../Column'

export default function V1TradeLink({ isV1TradeBetter }: { isV1TradeBetter: boolean }) {
  const theme = useContext(ThemeContext)
  const location = useLocation()
  const search = useParsedQueryString()
  const toggled = useToggledVersion() === Version.v1

  const v1Location = useMemo(() => {
    return {
      ...location,
      search: `?${stringify({
        ...search,
        use: Version.v1
      })}`
    }
  }, [location, search])

  return isV1TradeBetter && !toggled ? (
    <YellowCard style={{ marginTop: '12px', padding: '8px 4px' }}>
      <AutoColumn gap="sm" justify="center" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Text lineHeight="145.23%;" fontSize={14} fontWeight={400} color={theme.text1}>
          There is a better price for this trade on{' '}
          <StyledInternalLink to={v1Location}>
            <b>Uniswap V1 ↗</b>
          </StyledInternalLink>
        </Text>
      </AutoColumn>
    </YellowCard>
  ) : null
}
