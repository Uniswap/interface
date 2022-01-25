import React from 'react'
import RcPagination from 'rc-pagination'
import { ChevronLeft, ChevronRight } from 'react-feather'

interface PaginationProps {
  page: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (newPage: number) => void
}

export function Pagination({ page, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  return (
    <RcPagination
      className="swapr-pagination"
      current={page}
      total={totalItems}
      pageSize={itemsPerPage}
      simple
      showTitle={false}
      onChange={onPageChange}
      prevIcon={<ChevronLeft size={14} />}
      nextIcon={<ChevronRight size={14} />}
    />
  )
}
