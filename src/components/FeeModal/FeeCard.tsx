import React from 'react'
import styled from 'styled-components'
import { TYPE } from '../../theme'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #001c2d;
  padding: 1rem 0.5rem;
  border-radius: 16px;
  text-align: center;
  margin-right: 1rem;
`

interface FeeCardProps {
  title: string
  subtitle: string
  style?: any
}

export default function FeeCard({ title, subtitle, style }: FeeCardProps) {
  const sub = subtitle.split(' ').join('\n')
  return (
    <Wrapper style={style}>
      <TYPE.mediumHeader fontWeight={600} style={{ marginBottom: 8 }}>
        {title}
      </TYPE.mediumHeader>
      <TYPE.subHeader style={{ whiteSpace: 'pre-line' }}>{sub}</TYPE.subHeader>
    </Wrapper>
  )
}
