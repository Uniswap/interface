import React, { CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'

import { DOTS, usePagination } from 'components/Pagination/usePagination'
import { PaginationButton, PaginationContainer, PaginationItem } from 'components/Pagination/styles'
import useTheme from 'hooks/useTheme'

export default function Pagination({
  onPageChange,
  totalCount,
  siblingCount = 1,
  currentPage,
  pageSize,
  style,
}: {
  onPageChange: (newPage: number) => void
  totalCount: number
  siblingCount?: number
  currentPage: number
  pageSize: number
  style?: CSSProperties
}) {
  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize,
  })

  const theme = useTheme()

  // If there are less than 2 times in pagination range we shall not render the component
  if (currentPage === 0 || paginationRange.length < 2) {
    return null
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

  const lastPage = paginationRange[paginationRange.length - 1]

  return (
    <PaginationContainer style={style}>
      <PaginationItem $disabled={currentPage === 1} onClick={onPrevious}>
        <PaginationButton>
          <ChevronLeft width={16} color={theme.primary} />
        </PaginationButton>
      </PaginationItem>
      {paginationRange.map((pageNumber, index) => {
        if (pageNumber === DOTS) {
          return (
            <PaginationItem key={index.toString()} $selected>
              &#8230;
            </PaginationItem>
          )
        }
        return (
          <PaginationItem
            key={index.toString()}
            $selected={pageNumber === currentPage}
            onClick={() => onPageChange(pageNumber as number)}
          >
            <PaginationButton active={pageNumber === currentPage}>{pageNumber}</PaginationButton>
          </PaginationItem>
        )
      })}
      <PaginationItem $disabled={currentPage === lastPage} onClick={onNext}>
        <PaginationButton>
          <ChevronRight width={16} color={theme.primary} />
        </PaginationButton>
      </PaginationItem>
    </PaginationContainer>
  )
}
