import styled from 'styled-components'

import Pagination from 'components/Pagination'

const CommonPagination = styled(Pagination)`
  padding: 1rem 0 0 0;
  border-top: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
     margin: 0 16px;
     padding: 1rem;
  `};
`

export default CommonPagination
