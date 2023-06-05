import Column, { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import styled, { css, keyframes } from 'styled-components/macro'

export const PortfolioRowWrapper = styled(Row)<{ onClick?: any }>`
  gap: 12px;
  height: 68px;
  padding: 0 16px;

  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} background-color`};

  ${({ onClick }) => onClick && 'cursor: pointer'};

  &:hover {
    cursor: pointer;
  }
`

const EndColumn = styled(Column)`
  align-items: flex-end;
`

export default function PortfolioRow({
  ['data-testid']: testId,
  left,
  title,
  descriptor,
  right,
  onClick,
}: {
  'data-testid'?: string
  left: React.ReactNode
  title: React.ReactNode
  descriptor?: React.ReactNode
  right?: React.ReactNode
  setIsHover?: (b: boolean) => void
  onClick?: () => void
}) {
  return (
    <PortfolioRowWrapper data-testid={testId} onClick={onClick}>
      {left}
      <AutoColumn grow>
        {title}
        {descriptor}
      </AutoColumn>
      {right && <EndColumn>{right}</EndColumn>}
    </PortfolioRowWrapper>
  )
}

function PortfolioSkeletonRow({ shrinkRight }: { shrinkRight?: boolean }) {
  return (
    <PortfolioRowWrapper>
      <LoadingBubble height="40px" width="40px" round />
      <AutoColumn grow gap="4px">
        <LoadingBubble height="16px" width="60px" delay="300ms" />
        <LoadingBubble height="10px" width="90px" delay="300ms" />
      </AutoColumn>
      <EndColumn gap="xs">
        {shrinkRight ? (
          <LoadingBubble height="12px" width="20px" delay="600ms" />
        ) : (
          <>
            <LoadingBubble height="14px" width="70px" delay="600ms" />
            <LoadingBubble height="14px" width="50px" delay="600ms" />
          </>
        )}
      </EndColumn>
    </PortfolioRowWrapper>
  )
}

export function PortfolioSkeleton({ shrinkRight = false }: { shrinkRight?: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <PortfolioSkeletonRow shrinkRight={shrinkRight} key={`portfolio loading row${i}`} />
      ))}
    </>
  )
}

const fadeIn = keyframes`
  from { opacity: .25 }
  to { opacity: 1 }
`
export const portfolioFadeInAnimation = css`
  animation: ${fadeIn} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.in}`};
`

export const PortfolioTabWrapper = styled.div`
  ${portfolioFadeInAnimation}
`
