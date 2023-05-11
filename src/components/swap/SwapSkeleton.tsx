import { Trans } from '@lingui/macro'
import { ArrowContainer } from 'pages/Swap'
import { ArrowDown } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ArrowWrapper } from './styleds'

const StyledArrowWrapper = styled(ArrowWrapper)`
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
`

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: space-between;

  padding: 8px;
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.backgroundSurface};
`

const Blob = styled.div<{ width?: number; radius?: number }>`
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: ${({ radius }) => (radius ?? 4) + 'px'};
  height: 56px;
  width: ${({ width }) => (width ? width + 'px' : '100%')};
`

const ModuleBlob = styled(Blob)`
  background-color: ${({ theme }) => theme.backgroundOutline};
  height: 36px;
`

const TitleColumn = styled.div`
  padding: 8px;
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
  border-radius: 16px;
  display: flex;
  gap: 30px;
  padding: 48px 12px;
`

const OutputWrapper = styled.div`
  position: relative;
`

function Title() {
  return (
    <TitleColumn>
      <ThemedText.SubHeader>
        <Trans>Swap</Trans>
      </ThemedText.SubHeader>
    </TitleColumn>
  )
}

function FloatingInput() {
  return (
    <Row>
      <ModuleBlob width={60} />
      <ModuleBlob width={100} radius={16} />
    </Row>
  )
}

function FloatingButton() {
  return <Blob radius={16} />
}

export function SwapSkeleton() {
  const theme = useTheme()

  return (
    <LoadingWrapper>
      <Title />
      <InputColumn>
        <FloatingInput />
      </InputColumn>
      <OutputWrapper>
        <StyledArrowWrapper clickable={false}>
          <ArrowContainer>
            <ArrowDown size="16" color={theme.textTertiary} />
          </ArrowContainer>
        </StyledArrowWrapper>
        <InputColumn>
          <FloatingInput />
        </InputColumn>
      </OutputWrapper>
      <FloatingButton />
    </LoadingWrapper>
  )
}
