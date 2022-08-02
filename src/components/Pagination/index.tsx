import React, { CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'react-feather'
import { useMedia } from 'react-use'

import { DOTS, usePagination } from 'components/Pagination/usePagination'
import useTheme from 'hooks/useTheme'

import { PaginationButton, PaginationContainer, PaginationItem } from './styles'
import PaginationInputOnMobile from './PaginationInputOnMobile'

export default function Pagination({
  onPageChange,
  totalCount,
  siblingCount = 1,
  currentPage,
  pageSize,
  style = {},
  haveBg = true,
}: {
  onPageChange: (newPage: number) => void
  totalCount: number
  siblingCount?: number
  currentPage: number
  pageSize: number
  style?: CSSProperties
  haveBg?: boolean
}) {
  const upToExtraSmall = useMedia('(max-width: 576px)')

  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize,
  })

  const theme = useTheme()

  // this must be a number, not the DOT (string)
  const lastPage = paginationRange[paginationRange.length - 1] as number

  // If there are less than 2 times in pagination range we shall not render the component
  if (currentPage === 0 || paginationRange.length < 2) {
    return null
  }

  const handleClickToFirstPage = () => {
    onPageChange(1)
  }

  const handleClickToLastPage = () => {
    onPageChange(lastPage)
  }

  const onNext = () => {
    if (currentPage < paginationRange[paginationRange.length - 1]) {
      onPageChange(currentPage + 1)
    }
  }

  const onPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  if (upToExtraSmall) {
    return (
      <PaginationContainer style={{ columnGap: '4px', background: haveBg ? undefined : 'transparent', ...style }}>
        <PaginationItem $disabled={currentPage === 1} onClick={handleClickToFirstPage}>
          <PaginationButton haveBg={haveBg}>
            <ChevronsLeft width={16} color={theme.subText} />
          </PaginationButton>
        </PaginationItem>

        <PaginationItem $disabled={currentPage === 1} onClick={onPrevious}>
          <PaginationButton haveBg={haveBg}>
            <ChevronLeft width={16} color={theme.subText} />
          </PaginationButton>
        </PaginationItem>

        <PaginationInputOnMobile page={currentPage} lastPage={lastPage} setPage={onPageChange} />

        <PaginationItem $disabled={currentPage === lastPage} onClick={onNext}>
          <PaginationButton haveBg={haveBg}>
            <ChevronRight width={16} color={theme.subText} />
          </PaginationButton>
        </PaginationItem>

        <PaginationItem $disabled={currentPage === lastPage} onClick={handleClickToLastPage}>
          <PaginationButton haveBg={haveBg}>
            <ChevronsRight width={16} color={theme.subText} />
          </PaginationButton>
        </PaginationItem>
      </PaginationContainer>
    )
  }

  return (
    <PaginationContainer style={{ background: haveBg ? undefined : 'transparent', ...style }}>
      <PaginationItem $disabled={currentPage === 1} onClick={onPrevious}>
        <PaginationButton haveBg={haveBg}>
          <ChevronLeft width={16} color={theme.subText} />
        </PaginationButton>
      </PaginationItem>
      {paginationRange.map((pageNumber, index) => {
        if (pageNumber === DOTS) {
          return <PaginationItem key={index.toString()}>&#8230;</PaginationItem>
        }
        return (
          <PaginationItem
            key={index.toString()}
            $selected={pageNumber === currentPage}
            onClick={() => onPageChange(pageNumber as number)}
          >
            <PaginationButton haveBg={haveBg} active={pageNumber === currentPage}>
              {pageNumber}
            </PaginationButton>
          </PaginationItem>
        )
      })}
      <PaginationItem $disabled={currentPage === lastPage} onClick={onNext}>
        <PaginationButton haveBg={haveBg}>
          <ChevronRight width={16} color={theme.subText} />
        </PaginationButton>
      </PaginationItem>
    </PaginationContainer>
  )
}
