import styled from 'styled-components'

import { BlackCard } from 'components/Card'
import { AutoColumn } from 'components/Column'

export const Container = styled.div`
  text-align: center;
  width: calc(100% - 24px);
  margin: 0 auto 12px;
  max-width: 1200px;
  border-radius: 0.5rem;
`

export const GridColumn = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1.35fr 2fr;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
  `}
`

export const FirstColumn = styled(AutoColumn)`
  height: fit-content;
  padding-right: 24px;
  border-right: 1px solid ${({ theme }) => theme.border};
  grid-auto-rows: min-content;
  gap: 1rem;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border: none;
    padding-right: 0;
    gap: 20px;
  `}
`

export const SecondColumn = styled(AutoColumn)`
  border-radius: 1.25rem;
  grid-auto-rows: min-content;
`

export const Content = styled.div`
  background: ${({ theme }) => theme.background};
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 1rem;
  `}
`

export const AmoutToRemoveContent = styled(BlackCard)`
  padding: 1rem;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
    background: transparent;
  `}
`

export const TokenId = styled.div<{ color: string }>`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ color }) => color};
`

export const TokenInputWrapper = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`
