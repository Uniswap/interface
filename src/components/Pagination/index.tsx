import React from 'react'
import styled from 'styled-components'
import RcPagination from 'rc-pagination'
import { ChevronLeft, ChevronRight } from 'react-feather'

const PageContainer = styled.div<{ active?: boolean }>`
  width: 28px;
  height: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border 0.3s ease, color 0.3s ease;
  border: solid 1px ${props => (!props.active ? props.theme.bg3 : props.theme.bg4)};
  border-radius: 4px;
  font-size: 14px;
  color: ${props => (!props.active ? props.theme.text3 : props.theme.text4)};
`

interface PaginationProps {
  page: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (newPage: number) => void
}

export default function Pagination({ page, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  return (
    <RcPagination
      className="swapr-pagination"
      current={page}
      total={totalItems}
      pageSize={itemsPerPage}
      onChange={onPageChange}
      hideOnSinglePage
      itemRender={(current, type) => {
        switch (type) {
          case 'next': {
            return (
              <PageContainer>
                <ChevronRight size={14} />
              </PageContainer>
            )
          }
          case 'prev': {
            return (
              <PageContainer>
                <ChevronLeft size={14} />
              </PageContainer>
            )
          }
          case 'page': {
            return <PageContainer>{current}</PageContainer>
          }
          default: {
            return null
          }
        }
      }}
    />
  )
}
