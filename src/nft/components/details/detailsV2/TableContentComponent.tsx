import { ScrollBarStyles } from 'components/Common'
import { useSubscribeScrollState } from 'nft/hooks'
import styled from 'styled-components/macro'

import { TableTabsKeys } from './DataPageTable'
import { Scrim } from './shared'

const TableRowsContainer = styled.div`
  position: relative;
`

const TableRowScrollableContainer = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 264px;

  ${ScrollBarStyles}
`

const TableHeaderRowContainer = styled.div<{ userCanScroll: boolean }>`
  margin-right: ${({ userCanScroll }) => (userCanScroll ? '11px' : '0')};
`

const TableRowContainer = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  &:last-child {
    border-bottom: none;
  }
`

interface TableContentComponentProps {
  headerRow: React.ReactNode
  contentRows: React.ReactNode[]
  type: TableTabsKeys
}

export const TableContentComponent = ({ headerRow, contentRows, type }: TableContentComponentProps) => {
  const { userCanScroll, scrollRef, scrollProgress, scrollHandler } = useSubscribeScrollState()

  return (
    <>
      <TableHeaderRowContainer userCanScroll={userCanScroll}>{headerRow}</TableHeaderRowContainer>
      <TableRowsContainer>
        {scrollProgress > 0 && <Scrim />}
        <TableRowScrollableContainer ref={scrollRef} onScroll={scrollHandler}>
          {contentRows.map((row, index) => (
            <TableRowContainer key={type + '_row_' + index}>{row}</TableRowContainer>
          ))}
        </TableRowScrollableContainer>
        {userCanScroll && scrollProgress !== 100 && <Scrim isBottom={true} />}
      </TableRowsContainer>
    </>
  )
}
