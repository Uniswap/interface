import { ArrowContainer } from 'pages/Swap'
import { ArrowDown } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import { ArrowWrapper } from './styleds'

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 8px;
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  border-radius: 1rem;
`

const Blob = styled.div<{ height: string; width: string; radius?: number; isModule?: boolean; marginTop?: number }>`
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: ${({ radius }) => (radius ?? 0.25) + 'rem'};
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  margin-top: ${({ marginTop }) => (marginTop ?? 0) + 'rem'};
`

const ModuleBlob = styled(Blob)`
  background-color: ${({ theme }) => theme.backgroundOutline};
`

const WideColumn = styled.div`
  display: flex;
  flex-flow: column;
  width: 100%;
  gap: 0.75rem;
`

const TitleColumn = styled.div`
  display: flex;
  flex-flow: column;
  padding: 0.5rem;
  padding-bottom: 1.25rem;
  width: 100%;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InputColumn = styled.div`
  display: flex;
  flex-flow: column;
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 1rem;
  display: flex;
  gap: 1.875rem;
  padding: 0.75rem;
  padding-bottom: 3.25rem;
  padding-top: 3.25rem;
`

const OutputColumn = styled(InputColumn)`
  padding-bottom: 3rem;
  padding-top: 3.5rem;
`

function FloatingTitle() {
  return (
    <TitleColumn>
      <Blob height="1rem" width="2.5rem" />
    </TitleColumn>
  )
}

function FloatingInput() {
  return (
    <WideColumn>
      <Row>
        <ModuleBlob height="2rem" width="3.75rem" />
        <ModuleBlob height="2rem" width="7.25rem" />
      </Row>
    </WideColumn>
  )
}

function FloatingButton() {
  return <Blob marginTop={0.55} height="3.5rem" width="100%" radius={0.75} />
}

export function SwapSkeleton() {
  const theme = useTheme()

  return (
    <LoadingWrapper>
      <FloatingTitle />
      <InputColumn>
        <FloatingInput />
      </InputColumn>
      <div>
        <ArrowWrapper clickable={false}>
          <ArrowContainer color={theme.textPrimary}>
            <ArrowDown size="16" color={theme.textTertiary} />
          </ArrowContainer>
        </ArrowWrapper>
        <OutputColumn>
          <FloatingInput />
        </OutputColumn>
        <FloatingButton />
      </div>
    </LoadingWrapper>
  )
}
