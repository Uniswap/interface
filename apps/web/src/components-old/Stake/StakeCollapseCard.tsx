import { darken } from 'polished'
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import { ButtonEmpty } from '../Button'
import Card, { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import { CardNoise } from '../earn/styled'
import { AutoRow, RowBetween, RowFixed } from '../Row'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`
const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme }) => theme.bg1};
  position: relative;
  overflow: hidden;
`

// const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
//   border: none;
//   background: ${({ theme, bgColor }) =>
//   `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${theme.bg3} 100%) `};
//   position: relative;
//   overflow: hidden;
// `

interface StakeCollapseCardProps {
  title: string
  gap?: string
  children?: React.ReactNode
}

export default function StakeCollapseCard({ title, gap = '12px', children }: StakeCollapseCardProps) {
  const theme = useTheme()
  const [showMore, setShowMore] = useState(false)

  return (
    <StyledPositionCard bgColor={theme.primary1}>
      <CardNoise />
      <AutoColumn gap={gap}>
        <FixedHeightRow>
          <AutoRow gap="8px">
            <Text fontWeight={600} fontSize={20}>
              {title}
            </Text>
          </AutoRow>
          <RowFixed gap="8px">
            <ButtonEmpty
              padding="6px 8px"
              borderRadius="12px"
              width="fit-content"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? (
                <ChevronUp size="24" style={{ marginLeft: '10px' }} />
              ) : (
                <ChevronDown size="24" style={{ marginLeft: '10px' }} />
              )}
            </ButtonEmpty>
          </RowFixed>
        </FixedHeightRow>

        {showMore && <>{children}</>}
      </AutoColumn>
    </StyledPositionCard>
  )
}
