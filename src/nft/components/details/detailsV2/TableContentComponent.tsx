import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { useSubscribeScrollState } from 'nft/hooks'
import styled from 'styled-components/macro'

import { TableTabsKeys } from './DataPageTable'
import { Scrim } from './shared'

const CellContainer = styled.div<{ flex?: number; $justifyContent?: string }>`
  flex: ${(props) => props.flex || 0};
  justify-content: ${({ $justifyContent }) => $justifyContent};
`

const TraitRowScrollableContainer = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 224px;

  ${ScrollBarStyles}
`

// TODO convert to styled component
export interface TableCell {
  flex?: number
  justifyContent?: string
  content: React.ReactNode
  key: string
}

interface TableContentContainerProps {
  headerRow: TableCell[]
  contentRows: TableCell[][]
  type: TableTabsKeys
}

export const TableContentContainer = ({ headerRow, contentRows, type }: TableContentContainerProps) => {
  const { userCanScroll, scrollRef, scrollProgress, scrollHandler } = useSubscribeScrollState()

  return (
    <>
      <Row gap="12">Header</Row>
      {contentRows.map((row, index) => (
        // TODO Replace with real key
        <Row gap="12" key={type + '_row_' + index}>
          {scrollProgress > 0 && <Scrim />}
          <TraitRowScrollableContainer ref={scrollRef} onScroll={scrollHandler}>
            {row.map((cell) => (
              <CellContainer flex={cell.flex} $justifyContent={cell.justifyContent} key={cell.key}>
                {cell.content}
              </CellContainer>
            ))}
          </TraitRowScrollableContainer>
          {userCanScroll && scrollProgress !== 100 && <Scrim isBottom={true} />}
        </Row>
      ))}
    </>
  )
}
