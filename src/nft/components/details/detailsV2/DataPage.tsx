import Column from 'components/Column'
import styled from 'styled-components/macro'

import { DataPageDescription } from './DataPageDescription'
import { DataPageHeader } from './DataPageHeader'
import { DataPageTable } from './DataPageTable'
import { DataPageTraits } from './DataPageTraits'

const DataPageContainer = styled(Column)`
  padding: 24px 120px 45px;
  width: 100%;
`

// TODO remove
// eslint-disable-next-line import/no-unused-modules
export const DataPage = () => {
  return (
    <DataPageContainer>
      <DataPageHeader />
      <DataPageTraits />
      <DataPageTable />
      <DataPageDescription />
    </DataPageContainer>
  )
}
