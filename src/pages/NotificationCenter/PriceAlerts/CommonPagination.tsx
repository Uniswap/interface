import styled from 'styled-components'

import Pagination from 'components/Pagination'

const CommonPagination = styled(Pagination)`
  margin: 1rem 0 0 0;
  padding: 0 1rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`
     margin: 1rem 0;
  `};
`

export default CommonPagination
