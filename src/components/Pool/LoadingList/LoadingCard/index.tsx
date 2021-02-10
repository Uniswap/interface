import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import ContentLoader from 'react-content-loader'
import { DarkCard } from '../../../Card'

const SizedCard = styled(DarkCard)<{ wide?: boolean }>`
  width: ${props => (props.wide ? 208 : 155)}px;
  height: ${props => (props.height ? 155 : 147)}px;
`

interface LoadingCardsProps {
  wide?: boolean
}

export default function LoadingCard({ wide }: LoadingCardsProps) {
  const theme = useContext(ThemeContext)

  return (
    <SizedCard padding="20px" wide={wide}>
      {wide ? (
        <ContentLoader backgroundColor={theme.bg3} foregroundColor={theme.bg2} viewBox="0 0 93px 97px">
          <circle cx="86.5" cy="28" r="14" />
          <rect x="66.5" y="54" rx="2" ry="2" width="40" height="16" />
          <rect x="60.5" y="80.5" rx="2" ry="2" width="50" height="9" />
        </ContentLoader>
      ) : (
        <ContentLoader backgroundColor={theme.bg3} foregroundColor={theme.bg2} viewBox="0 0 93px 97px">
          <circle cx="59.5" cy="28" r="14" />
          <rect x="39.5" y="54" rx="2" ry="2" width="40" height="16" />
          <rect x="34.5" y="80.5" rx="2" ry="2" width="50" height="9" />
        </ContentLoader>
      )}
    </SizedCard>
  )
}
