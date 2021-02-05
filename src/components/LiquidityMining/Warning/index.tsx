import React from 'react'
import styled from 'styled-components'
import { TYPE } from '../../../theme'
import { AutoColumn } from '../../Column'
import { CardSection } from '../../earn/styled'
import { RowBetween } from '../../Row'

const Card = styled.div`
  overflow: hidden;
  background-color: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg2};
  border-radius: 8px;
`

export function LiquidityMiningWarning() {
  return (
    <Card style={{ marginTop: '32px' }}>
      <CardSection>
        <AutoColumn gap="md">
          <RowBetween>
            <TYPE.body fontWeight={600} lineHeight="20px">
              Swapr liquidity mining
            </TYPE.body>
          </RowBetween>
          <RowBetween>
            <TYPE.body fontWeight="500" fontSize="12px" lineHeight="20px" letterSpacing="-0.4px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </TYPE.body>
          </RowBetween>
        </AutoColumn>
      </CardSection>
    </Card>
  )
}
