import Column, { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { useMemo } from 'react'
import styled from 'styled-components/macro'

const RowWrapper = styled(Row)<{ onClick?: any }>`
  gap: 8px;
  height: 68px;
  padding: 0 16px;

  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} background-color`};

  ${({ onClick }) => onClick && 'cursor: pointer'};

  &:hover {
    background: ${({ theme }) => theme.hoverDefault};
  }
`

const EndColumn = styled(Column)`
  align-items: flex-end;
`

export default function PortfolioRow({
  left,
  title,
  descriptor,
  right,
  setIsHover,
  onClick,
}: {
  left: React.ReactNode
  title: React.ReactNode
  descriptor: React.ReactNode
  right: React.ReactNode
  setIsHover?: (b: boolean) => void
  onClick?: () => void
}) {
  const onHover = useMemo(
    () =>
      setIsHover && {
        onMouseEnter: () => setIsHover?.(true),
        onMouseLeave: () => setIsHover?.(false),
      },
    [setIsHover]
  )
  return (
    <RowWrapper {...onHover} onClick={onClick}>
      {left}
      <AutoColumn grow>
        {title}
        {descriptor}
      </AutoColumn>
      <EndColumn>{right}</EndColumn>
    </RowWrapper>
  )
}

function PortfolioSkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <RowWrapper>
      <LoadingBubble height="40px" width="40px" round delay={`${delay}ms`} />
      <AutoColumn grow gap="4px">
        <LoadingBubble height="16px" width="60px" delay={`${delay + 300}ms`} />
        <LoadingBubble height="10px" width="90px" delay={`${delay + 300}ms`} />
      </AutoColumn>
      <EndColumn gap="xs">
        <LoadingBubble height="14px" width="70px" delay={`${delay + 600}ms`} />
        <LoadingBubble height="14px" width="50px" delay={`${delay + 600}ms`} />
      </EndColumn>
    </RowWrapper>
  )
}

export function PortfolioSkeleton() {
  return (
    <>
      <PortfolioSkeletonRow />
      <PortfolioSkeletonRow />
      <PortfolioSkeletonRow />
      <PortfolioSkeletonRow />
      <PortfolioSkeletonRow />
      <PortfolioSkeletonRow />
    </>
  )
}
