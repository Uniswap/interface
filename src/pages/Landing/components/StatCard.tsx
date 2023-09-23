import styled from 'styled-components'

import { H3 } from './Generics'

type StatCardProps = {
  title: string
  value: string
  prefix?: string
  suffix?: string
}

export default function ValuePropCard(props: StatCardProps) {
  return (
    <Container>
      <H3>{props.title}</H3>
      <StatText>{props.value}</StatText>
    </Container>
  )
}

const StatText = styled.div`
  font-variant-numeric: lining-nums tabular-nums;
  font-family: Basel;
  font-size: 52px;
  font-style: normal;
  font-weight: 500;
  line-height: 60px; /* 115.385% */
  color: ${({ theme }) => theme.neutral2};
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  border-radius: 20px;
  padding: 32px 28px;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.surface2};
  overflow: hidden;
`
