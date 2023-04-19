import Column from 'components/Column'
import Row from 'components/Row'
import styled from 'styled-components/macro'

import { containerStyles } from './shared'

const TableContainer = styled(Column)`
  width: 100%;
  height: 604px;
  align-self: flex-start;
  padding: 20px 0px 16px;

  ${containerStyles}
`

export const DataPageTable = () => {
  return (
    <TableContainer>
      Table
      <Row></Row>
    </TableContainer>
  )
}
