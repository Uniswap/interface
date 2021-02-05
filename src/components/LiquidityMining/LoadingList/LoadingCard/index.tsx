import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Card } from '../../styleds'
import ContentLoader from 'react-content-loader'

const SizedCard = styled(Card)`
  width: 155px;
  height: 147px;
`

export default function LoadingCard() {
  const theme = useContext(ThemeContext)

  return (
    <SizedCard>
      <ContentLoader backgroundColor={theme.bg3} foregroundColor={theme.bg2} viewBox="0 0 93px 97px">
        <circle cx="46.5" cy="20" r="14" />
        <rect x="26.5" y="46" rx="4" ry="4" width="40" height="16" />
        <rect x="21.5" y="72.5" rx="4" ry="4" width="50" height="9" />
      </ContentLoader>
    </SizedCard>
  )
}
