import React, { CSSProperties } from 'react'
import { ArrowLeft, ArrowRight } from 'react-feather'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { ClickableText } from 'components/YieldPools/styleds'

const StyledPagination = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: ${({ theme }) => theme.oddRow};
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
    border: none;
    background-color: revert;
  `}
`

const PaginationText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

const Pagination = ({
  onPrev,
  onNext,
  currentPage,
  maxPage,
  style,
}: {
  onPrev: () => void
  onNext: () => void
  currentPage: number
  maxPage: number
  style?: CSSProperties
}) => {
  const theme = useTheme()
  return (
    <StyledPagination style={style}>
      <ClickableText>
        <ArrowLeft size={16} color={theme.primary} onClick={onPrev} />
      </ClickableText>
      <PaginationText>
        Page {currentPage} of {maxPage}
      </PaginationText>
      <ClickableText>
        <ArrowRight size={16} color={theme.primary} onClick={onNext} />
      </ClickableText>
    </StyledPagination>
  )
}

export default Pagination
