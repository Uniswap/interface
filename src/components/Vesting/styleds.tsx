import styled from 'styled-components'

export const ScheduleGrid = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr 1fr;
  margin-top: 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
`
