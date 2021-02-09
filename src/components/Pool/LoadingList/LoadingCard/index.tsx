import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import ContentLoader from 'react-content-loader'
import { DarkCard } from '../../../Card'

const SizedCard = styled(DarkCard)`
  width: 155px;
  height: 147px;
`

export default function LoadingCard() {
  const theme = useContext(ThemeContext)

  return (
    <SizedCard padding="20px">
      <ContentLoader backgroundColor={theme.bg3} foregroundColor={theme.bg2} viewBox="0 0 93px 97px">
        <circle cx="59.5" cy="28" r="14" />
        <rect x="39.5" y="54" rx="2" ry="2" width="40" height="16" />
        <rect x="34.5" y="80.5" rx="2" ry="2" width="50" height="9" />
      </ContentLoader>
    </SizedCard>
  )
}
