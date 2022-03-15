import { BodyWrapper } from 'pages/AppBody'
import React from 'react'
import styled from 'styled-components'

const LimitOrderHistoryBodyWrapper = styled(BodyWrapper)`
  margin-top: 2rem;
`

export default function LimitOrderHistoryBody({ children }: { children: React.ReactNode }) {
  return <LimitOrderHistoryBodyWrapper>{children}</LimitOrderHistoryBodyWrapper>
}
